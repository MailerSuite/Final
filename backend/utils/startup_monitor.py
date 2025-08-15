#!/usr/bin/env python3
"""
Startup Monitor Interface for SGPT Backend
Provides compatibility layer for startup monitoring functionality
"""

from typing import Any, Dict

from .startup_tracker import StartupMonitor


async def run_startup_monitoring(
    engine: Any, port: int = 8000
) -> Dict[str, Any]:
    """
    Run startup monitoring process
    
    Args:
        engine: Database engine (for compatibility)
        port: Backend server port
        
    Returns:
        Dict containing monitoring results
    """
    try:
        monitor = StartupMonitor(port=port)
        
        # Run the monitoring process
        await monitor.monitor_startup()
        
        # Return the status
        return {
            "status": "success",
            "monitor": monitor,
            "startup_time": monitor.start_time,
            "stages_completed": monitor.status.get("stages_completed", []),
            "port_status": monitor.status.get("port_status", "unknown"),
            "health_status": monitor.status.get("health_status", "unknown")
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "monitor": None
        }


def startup_monitor(port: int = 8000) -> StartupMonitor:
    """
    Create a startup monitor instance (for compatibility)
    
    Args:
        port: Backend server port
        
    Returns:
        StartupMonitor instance
    """
    return StartupMonitor(port=port) 