#!/usr/bin/env python3
"""
Startup Monitor for SGPT Backend
Provides real-time monitoring of startup progress and detailed error reporting
"""

import asyncio
import json
import time
from pathlib import Path

import psutil
import requests
from debug_logger import (
    log_failure,
    log_startup,
    log_success,
)


class StartupMonitor:
    """Real-time startup monitoring and status tracking"""

    def __init__(self, port: int = 8000, timeout: int = 120):
        self.port = port
        self.timeout = timeout
        self.start_time = time.time()
        self.status = {
            "startup_time": self.start_time,
            "current_stage": "initializing",
            "stages_completed": [],
            "stages_failed": [],
            "process_id": None,
            "port_status": "unknown",
            "health_status": "unknown",
            "last_check": None,
        }

    async def monitor_startup(self):
        """Monitor the startup process in real-time"""
        print("🔍 SGPT BACKEND STARTUP MONITOR")
        print("=" * 50)

        # Stage 1: Check if process is starting
        await self.check_process_startup()

        # Stage 2: Monitor port binding
        await self.monitor_port_binding()

        # Stage 3: Test health endpoint
        await self.test_health_endpoint()

        # Stage 4: Final status report
        await self.generate_final_report()

    async def check_process_startup(self):
        """Check if the backend process is starting"""
        log_startup("Process Startup Check")
        print("1️⃣ Checking process startup...")

        max_attempts = 30
        for attempt in range(max_attempts):
            processes = self.find_backend_processes()

            if processes:
                self.status["process_id"] = processes[0]["pid"]
                self.status["current_stage"] = "process_running"
                self.status["stages_completed"].append("process_startup")
                log_success("Process Startup")
                print(
                    f"✅ Backend process started (PID: {processes[0]['pid']})"
                )
                return True

            await asyncio.sleep(1)
            print(f"⏳ Waiting for process... ({attempt + 1}/{max_attempts})")

        self.status["stages_failed"].append("process_startup")
        log_failure(
            "Process Startup",
            Exception("Process failed to start within timeout"),
        )
        print("❌ Process failed to start")
        return False

    async def monitor_port_binding(self):
        """Monitor when the port becomes available"""
        log_startup("Port Binding Monitor")
        print("2️⃣ Monitoring port binding...")

        max_attempts = 60
        for attempt in range(max_attempts):
            if self.is_port_bound():
                self.status["port_status"] = "bound"
                self.status["current_stage"] = "port_bound"
                self.status["stages_completed"].append("port_binding")
                log_success("Port Binding")
                print(f"✅ Port {self.port} is now bound")
                return True

            await asyncio.sleep(1)
            print(
                f"⏳ Waiting for port binding... ({attempt + 1}/{max_attempts})"
            )

        self.status["port_status"] = "failed"
        self.status["stages_failed"].append("port_binding")
        log_failure(
            "Port Binding",
            Exception(f"Port {self.port} failed to bind within timeout"),
        )
        print(f"❌ Port {self.port} failed to bind")
        return False

    async def test_health_endpoint(self):
        """Test the health endpoint"""
        log_startup("Health Endpoint Test")
        print("3️⃣ Testing health endpoint...")

        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                response = requests.get(
                    f"http://localhost:{self.port}/health", timeout=5
                )
                if response.status_code == 200:
                    self.status["health_status"] = "healthy"
                    self.status["current_stage"] = "ready"
                    self.status["stages_completed"].append("health_check")
                    log_success("Health Endpoint")
                    print("✅ Health endpoint responding")
                    return True
            except requests.exceptions.RequestException:
                pass

            await asyncio.sleep(1)
            print(
                f"⏳ Waiting for health endpoint... ({attempt + 1}/{max_attempts})"
            )

        self.status["health_status"] = "unhealthy"
        self.status["stages_failed"].append("health_check")
        log_failure(
            "Health Endpoint", Exception("Health endpoint failed to respond")
        )
        print("❌ Health endpoint failed to respond")
        return False

    async def generate_final_report(self):
        """Generate final startup report"""
        total_time = time.time() - self.start_time
        self.status["total_time"] = total_time
        self.status["last_check"] = time.time()

        print("\n" + "=" * 50)
        print("📊 STARTUP MONITORING REPORT")
        print("=" * 50)
        print(f"Total startup time: {total_time:.2f}s")
        print(f"Current stage: {self.status['current_stage']}")
        print(f"Stages completed: {len(self.status['stages_completed'])}")
        print(f"Stages failed: {len(self.status['stages_failed'])}")

        if self.status["stages_completed"]:
            print("\n✅ COMPLETED STAGES:")
            for stage in self.status["stages_completed"]:
                print(f"  - {stage}")

        if self.status["stages_failed"]:
            print("\n❌ FAILED STAGES:")
            for stage in self.status["stages_failed"]:
                print(f"  - {stage}")

        print("\n🔧 STATUS:")
        print(f"  - Process ID: {self.status['process_id'] or 'Unknown'}")
        print(f"  - Port Status: {self.status['port_status']}")
        print(f"  - Health Status: {self.status['health_status']}")

        if len(self.status["stages_failed"]) == 0:
            print("\n🎉 BACKEND STARTUP SUCCESSFUL!")
            print(f"🌐 Backend is available at: http://localhost:{self.port}")
        else:
            print("\n⚠️ BACKEND STARTUP INCOMPLETE")
            print("Check logs for detailed error information")

        # Save status to file
        self.save_status_report()

    def find_backend_processes(self) -> list:
        """Find backend processes"""
        processes = []
        for proc in psutil.process_iter(["pid", "name", "cmdline"]):
            try:
                if proc.info["cmdline"] and any(
                    "uvicorn" in cmd for cmd in proc.info["cmdline"]
                ):
                    processes.append(
                        {
                            "pid": proc.info["pid"],
                            "name": proc.info["name"],
                            "cmdline": proc.info["cmdline"],
                        }
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return processes

    def is_port_bound(self) -> bool:
        """Check if the port is bound"""
        try:
            import socket

            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(("localhost", self.port))
            sock.close()
            return result == 0
        except:
            return False

    def save_status_report(self):
        """Save status report to file"""
        try:
            log_dir = Path("logs")
            log_dir.mkdir(exist_ok=True)

            report_file = log_dir / "startup_monitor_report.json"
            with open(report_file, "w") as f:
                json.dump(self.status, f, indent=2, default=str)

            print(f"\n📁 Status report saved to: {report_file}")
        except Exception as e:
            print(f"Warning: Could not save status report: {e}")


async def main():
    """Main monitoring function"""
    monitor = StartupMonitor(port=8000, timeout=120)
    await monitor.monitor_startup()


if __name__ == "__main__":
    asyncio.run(main())
