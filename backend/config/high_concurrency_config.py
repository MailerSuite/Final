"""
🚀 HIGH-CONCURRENCY CONFIGURATION
Optimized for VPS: 5 vCPU, 6GB RAM, 50GB NVMe
Target: 1000+ concurrent threads with smooth performance
"""

import os
from typing import Dict, Any

# VPS Specifications
VPS_SPECS = {
    "cpu_cores": 5,
    "ram_gb": 6,
    "disk_gb": 50,
    "target_threads": 1000,
}

# Database Connection Pool Optimization
DATABASE_CONFIG = {
    "pool_size": 50,  # Increased from 30
    "max_overflow": 200,  # Increased from 120
    "pool_timeout": 30,  # Increased from 15
    "pool_recycle": 900,
    "pool_pre_ping": True,
    "echo": False,  # Disable SQL logging for performance
}

# PostgreSQL Server Settings for High Concurrency
POSTGRES_OPTIMIZATIONS = {
    "application_name": "SGPT_HighConcurrency",
    "jit": "off",  # Disable JIT for predictable performance
    "random_page_cost": "1.1",  # Optimize for SSD
    "effective_cache_size": "2GB",  # 33% of 6GB RAM
    "shared_buffers": "256MB",  # 4% of 6GB RAM
    "work_mem": "16MB",  # Optimized for high concurrency
    "maintenance_work_mem": "128MB",  # Optimized for VPS
    "max_connections": "200",  # Increased for high concurrency
    "max_worker_processes": "10",  # 2x CPU cores
    "max_parallel_workers_per_gather": "2",  # Optimized for 5 vCPU
    "max_parallel_workers": "8",  # Optimized for 5 vCPU
    "checkpoint_completion_target": "0.9",  # Faster checkpoints
    "wal_buffers": "16MB",  # Optimized for high concurrency
    "default_statistics_target": "100",  # Reduced for performance
    "autovacuum_max_workers": "3",  # Optimized for VPS
    "autovacuum_naptime": "10s",  # More frequent vacuuming
}

# Redis Connection Pool for High Concurrency
REDIS_CONFIG = {
    "pool_size": 100,
    "max_connections": 200,
    "connection_timeout": 30,
    "read_timeout": 30,
    "write_timeout": 30,
    "retry_on_timeout": True,
    "health_check_interval": 30,
}

# Celery Worker Configuration for High Concurrency
CELERY_CONFIG = {
    "worker_concurrency": 50,  # 50 threads per worker
    "worker_max_tasks_per_child": 2000,  # Increased for high concurrency
    "worker_prefetch_multiplier": 8,  # Increased prefetch for efficiency
    "worker_max_memory_per_child": 300000,  # 300MB per worker
    "task_soft_time_limit": 600,  # 10 minutes soft limit
    "task_time_limit": 1200,  # 20 minutes hard limit
    "result_expires": 1800,  # 30 minutes result retention
    "broker_pool_limit": 100,
    "broker_connection_max_retries": 15,
}

# Worker Scaling Configuration
WORKER_SCALING = {
    "min_workers": 5,
    "max_workers": 20,  # 20 workers max for VPS
    "scale_up_threshold": 0.7,  # Scale up when 70% utilized
    "scale_down_threshold": 0.2,  # Scale down when 20% utilized
    "client_thread_multiplier": {
        "low": 2,      # 1-100 threads: 2x workers
        "medium": 4,   # 101-300 threads: 4x workers
        "high": 6,     # 301-600 threads: 6x workers
        "extreme": 8,  # 600+ threads: 8x workers
    },
    "memory_threshold": 80,  # 80% RAM usage
    "cpu_threshold": 85,  # 85% CPU usage
}

# Uvicorn Server Configuration for High Concurrency
UVICORN_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "reload": False,  # Disable reload for production performance
    "log_level": "warning",  # Reduce logging overhead
    "workers": 20,  # 20 workers for VPS
    "loop": "uvloop",  # Use uvloop for better performance
    "http": "httptools",  # Use httptools for better performance
    "limit_concurrency": 1000,  # Allow 1000 concurrent connections
    "limit_max_requests": 10000,  # Restart workers after 10k requests
    "timeout_keep_alive": 30,  # Keep-alive timeout
    "access_log": False,  # Disable access logs for performance
    "backlog": 2048,  # Increased connection backlog
    "forwarded_allow_ips": "*",  # Allow all forwarded IPs
    "proxy_headers": True,  # Enable proxy headers
    "server_header": False,  # Disable server header for security
}

# Async Task Configuration
ASYNC_CONFIG = {
    "semaphore_limit": 200,  # Concurrent async operations
    "task_queue_size": 1000,  # Task queue size
    "connection_timeout": 30,  # Connection timeout
    "request_timeout": 60,  # Request timeout
    "keep_alive_timeout": 30,  # Keep-alive timeout
}

# Memory Management Configuration
MEMORY_CONFIG = {
    "max_memory_usage_percent": 80,  # Max RAM usage
    "memory_cleanup_interval": 300,  # 5 minutes cleanup
    "gc_threshold": 1000,  # Garbage collection threshold
    "memory_warning_threshold": 70,  # Warning at 70% usage
}

# Performance Monitoring Configuration
MONITORING_CONFIG = {
    "metrics_interval": 30,  # 30 seconds
    "health_check_interval": 60,  # 1 minute
    "performance_logging": True,
    "slow_query_threshold": 1.0,  # 1 second
    "connection_pool_monitoring": True,
    "worker_health_monitoring": True,
}

# Rate Limiting Configuration for High Concurrency
RATE_LIMITING = {
    "enabled": True,
    "requests_per_minute": 1000,  # High limit for VPS
    "burst_limit": 2000,  # Allow burst for high concurrency
    "storage_backend": "redis",  # Use Redis for distributed rate limiting
    "cleanup_interval": 60,  # 1 minute cleanup
}

# Caching Configuration for High Concurrency
CACHE_CONFIG = {
    "enabled": True,
    "default_ttl": 300,  # 5 minutes default TTL
    "max_size": 1000,  # Max cache entries
    "cleanup_interval": 300,  # 5 minutes cleanup
    "compression": True,  # Enable compression
    "serialization": "json",  # Use JSON for compatibility
}

def get_optimized_config() -> Dict[str, Any]:
    """Get optimized configuration for high concurrency"""
    return {
        "vps_specs": VPS_SPECS,
        "database": DATABASE_CONFIG,
        "postgres": POSTGRES_OPTIMIZATIONS,
        "redis": REDIS_CONFIG,
        "celery": CELERY_CONFIG,
        "worker_scaling": WORKER_SCALING,
        "uvicorn": UVICORN_CONFIG,
        "async": ASYNC_CONFIG,
        "memory": MEMORY_CONFIG,
        "monitoring": MONITORING_CONFIG,
        "rate_limiting": RATE_LIMITING,
        "cache": CACHE_CONFIG,
    }

def validate_config() -> bool:
    """Validate configuration for VPS specifications"""
    config = get_optimized_config()
    
    # Check memory constraints
    total_workers = config["uvicorn"]["workers"]
    memory_per_worker = config["celery"]["worker_max_memory_per_child"] / (1024**2)  # MB
    total_memory_needed = total_workers * memory_per_worker
    
    if total_memory_needed > VPS_SPECS["ram_gb"] * 0.8:  # 80% of RAM
        print(f"⚠️  Warning: Workers may use {total_memory_needed:.1f}GB RAM")
        print(f"   Available: {VPS_SPECS['ram_gb']}GB")
        return False
    
    # Check CPU constraints
    if total_workers > VPS_SPECS["cpu_cores"] * 4:  # 4x CPU cores
        print(f"⚠️  Warning: {total_workers} workers may overload {VPS_SPECS['cpu_cores']} CPU cores")
        return False
    
    print("✅ Configuration validated for VPS specifications")
    return True

if __name__ == "__main__":
    print("🚀 High-Concurrency Configuration Validation")
    print("=" * 50)
    
    config = get_optimized_config()
    for section, settings in config.items():
        print(f"\n📋 {section.upper()}:")
        for key, value in settings.items():
            print(f"   • {key}: {value}")
    
    print("\n" + "=" * 50)
    validate_config() 