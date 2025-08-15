import importlib
import time
import traceback
from collections.abc import Callable
from typing import Any

# Import our debug logger
try:
    from utils.debug_logger import (
        debug_logger,
        log_crash,
        log_failure,
        log_import,
        log_service,
        log_startup,
        log_success,
    )
except ImportError:
    # Fallback if debug logger isn't available
    print("WARNING: Debug logger not available, using basic logging")
    import logging

    logging.basicConfig(level=logging.INFO)
    debug_logger = logging.getLogger("startup_wrapper")

    # Define fallback logging functions
    def log_startup(component, **kwargs):
        print(f"🚀 Starting {component}")

    def log_success(component, duration=None):
        print(
            f"✅ {component} completed"
            + (f" ({duration:.2f}s)" if duration else "")
        )

    def log_failure(component, error, duration=None):
        print(
            f"❌ {component} failed: {error}"
            + (f" ({duration:.2f}s)" if duration else "")
        )

    def log_crash(component, error, context=None):
        print(f"💥 {component} crashed: {error}")

    def log_import(module, success, error=None):
        if success:
            print(f"📦 Imported {module}")
        else:
            print(f"❌ Failed to import {module}: {error}")

    def log_service(service, status):
        print(f"🔧 {service}: {status}")


class StartupWrapper:
    """Wrapper to capture and log all startup information"""

    def __init__(self):
        self.startup_time = time.time()
        self.components = {}
        self.failures = []
        self.import_attempts = []

        # Log startup beginning
        log_startup("StartupWrapper", timestamp=self.startup_time)

    def import_module(
        self, module_name: str, alias: str = None
    ) -> Any | None:
        """Import a module with detailed logging"""
        start_time = time.time()
        alias = alias or module_name

        try:
            log_startup(f"Import {alias}", module=module_name)
            module = importlib.import_module(module_name)
            duration = time.time() - start_time
            log_success(f"Import {alias}", duration)
            log_import(module_name, True)
            self.import_attempts.append(
                {
                    "module": module_name,
                    "alias": alias,
                    "success": True,
                    "duration": duration,
                }
            )
            return module
        except Exception as e:
            duration = time.time() - start_time
            log_failure(f"Import {alias}", e, duration)
            log_import(module_name, False, e)
            self.import_attempts.append(
                {
                    "module": module_name,
                    "alias": alias,
                    "success": False,
                    "error": str(e),
                    "duration": duration,
                }
            )
            self.failures.append(
                {
                    "component": f"Import {alias}",
                    "error": e,
                    "duration": duration,
                }
            )
            return None

    def start_component(
        self, name: str, func: Callable, *args, **kwargs
    ) -> Any | None:
        """Start a component with detailed logging"""
        start_time = time.time()

        try:
            log_startup(name, args=args, kwargs=kwargs)
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            log_success(name, duration)
            self.components[name] = {
                "success": True,
                "duration": duration,
                "result": str(result) if result else None,
            }
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_failure(name, e, duration)
            log_crash(
                name,
                e,
                {
                    "args": str(args),
                    "kwargs": str(kwargs),
                    "duration": duration,
                },
            )
            self.components[name] = {
                "success": False,
                "duration": duration,
                "error": str(e),
                "traceback": traceback.format_exc(),
            }
            self.failures.append(
                {"component": name, "error": e, "duration": duration}
            )
            return None

    def check_imports(self, required_modules: list) -> dict[str, bool]:
        """Check if all required modules can be imported"""
        results = {}
        for module in required_modules:
            try:
                importlib.import_module(module)
                results[module] = True
                log_import(module, True)
            except ImportError as e:
                results[module] = False
                log_import(module, False, e)
        return results

    def generate_report(self) -> dict[str, Any]:
        """Generate a comprehensive startup report"""
        total_duration = time.time() - self.startup_time

        report = {
            "startup_time": self.startup_time,
            "total_duration": total_duration,
            "components": self.components,
            "import_attempts": self.import_attempts,
            "failures": [
                {
                    "component": f["component"],
                    "error": str(f["error"]),
                    "duration": f["duration"],
                }
                for f in self.failures
            ],
            "success_count": len(
                [c for c in self.components.values() if c["success"]]
            ),
            "failure_count": len(self.failures),
            "total_components": len(self.components),
        }

        return report

    def print_summary(self):
        """Print a human-readable summary of startup results"""
        report = self.generate_report()

        print("\n" + "=" * 60)
        print("🚀 STARTUP SUMMARY REPORT")
        print("=" * 60)
        print(f"Total startup time: {report['total_duration']:.2f}s")
        print(
            f"Components started: {report['success_count']}/{report['total_components']}"
        )
        print(f"Failures: {report['failure_count']}")

        if report["failures"]:
            print("\n❌ FAILURES:")
            for failure in report["failures"]:
                print(f"  - {failure['component']}: {failure['error']}")

        print("\n✅ SUCCESSFUL COMPONENTS:")
        for name, info in self.components.items():
            if info["success"]:
                print(f"  - {name} ({info['duration']:.2f}s)")

        print("=" * 60)


def wrap_startup(func: Callable) -> Callable:
    """Decorator to wrap a startup function with comprehensive logging"""

    def wrapper(*args, **kwargs):
        startup_wrapper = StartupWrapper()

        try:
            result = func(*args, **kwargs)
            startup_wrapper.print_summary()
            return result
        except Exception as e:
            log_crash(
                "StartupWrapper", e, {"args": str(args), "kwargs": str(kwargs)}
            )
            startup_wrapper.print_summary()
            raise

    return wrapper


# Convenience function for quick startup checks
def quick_startup_check():
    """Perform a quick startup check of critical components"""
    startup_wrapper = StartupWrapper()

    # Check critical imports (external dependencies only)
    critical_modules = [
        "fastapi",
        "sqlalchemy",
        "uvicorn",
        "pydantic",
        "psycopg2",
        "asyncpg",
        "redis",
        "celery",
    ]

    print("🔍 Checking critical imports...")
    import_results = startup_wrapper.check_imports(critical_modules)

    failed_imports = [
        mod for mod, success in import_results.items() if not success
    ]

    if failed_imports:
        print(f"❌ Failed imports: {failed_imports}")
        return False
    else:
        print("✅ All critical imports successful")
        return True


if __name__ == "__main__":
    # Test the startup wrapper
    quick_startup_check()
