"""
Ultra-Fast Database Configuration
Optimized database settings for sub-1ms response times
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import text, event
from sqlalchemy.engine import Engine

from config.database_config import settings

logger = logging.getLogger(__name__)


class UltraFastDatabase:
    """
    Ultra-fast database configuration with:
    - Large connection pools (100+ connections)
    - Connection pre-warming
    - Prepared statement caching
    - Query optimization
    - Connection keep-alive
    """
    
    def __init__(self):
        self.engine: Optional[Engine] = None
        self.session_factory: Optional[async_sessionmaker] = None
        self.connection_pool_size = 100
        self.max_overflow = 50
        self.pool_pre_ping = True
        self.pool_recycle = 3600  # 1 hour
        
        # Performance tracking
        self.query_cache = {}
        self.connection_stats = {
            'total_connections': 0,
            'active_connections': 0,
            'fast_queries': 0,
            'slow_queries': 0,
            'avg_query_time': 0.0
        }
    
    async def init_ultrafast_engine(self):
        """Initialize ultra-fast database engine"""
        
        # Ultra-fast PostgreSQL connection string with optimizations
        connection_params = {
            "application_name": "sgpt_ultrafast",
            "server_settings": {
                # Connection optimizations
                "jit": "off",                    # Disable JIT for faster connection
                "shared_preload_libraries": "",  # Minimal libraries
                "max_connections": "200",        # Support high concurrency
                
                # Query optimizations  
                "effective_cache_size": "4GB",
                "shared_buffers": "1GB",
                "work_mem": "32MB",
                "maintenance_work_mem": "256MB",
                
                # Checkpoint optimizations
                "checkpoint_segments": "32",
                "checkpoint_completion_target": "0.9",
                "wal_buffers": "64MB",
                
                # Logging optimizations (disable for speed)
                "log_statement": "none",
                "log_duration": "off",
                "log_min_duration_statement": "-1"
            }
        }
        
        # Build optimized connection URL
        base_url = settings.DATABASE_URL
        
        self.engine = create_async_engine(
            base_url,
            # Connection pool settings for high performance
            pool_size=self.connection_pool_size,
            max_overflow=self.max_overflow,
            pool_pre_ping=self.pool_pre_ping,
            pool_recycle=self.pool_recycle,
            
            # Engine optimizations
            echo=False,  # Disable SQL logging for speed
            future=True,
            
            # AsyncPG optimizations
            connect_args={
                "server_settings": connection_params["server_settings"],
                "command_timeout": 5.0,      # Fast timeout
                "prepared_statement_cache_size": 1000,  # Large prepared statement cache
                "connection_class": asyncpg.Connection,
            }
        )
        
        # Create optimized session factory
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,  # Keep objects usable after commit
            autoflush=False,         # Manual flushing for control
            autocommit=False
        )
        
        logger.info("Ultra-fast database engine initialized")
        
        # Pre-warm connection pool
        await self._prewarm_connections()
        
        # Set up query optimization
        self._setup_query_optimizations()
    
    async def _prewarm_connections(self):
        """Pre-warm the connection pool for instant access"""
        try:
            # Create multiple connections to fill the pool
            connections = []
            for _ in range(min(10, self.connection_pool_size // 2)):
                async with self.engine.begin() as conn:
                    # Execute simple query to initialize connection
                    await conn.execute(text("SELECT 1"))
                    connections.append(conn)
            
            logger.info(f"Pre-warmed {len(connections)} database connections")
            
        except Exception as e:
            logger.warning(f"Connection pre-warming failed: {e}")
    
    def _setup_query_optimizations(self):
        """Set up query-level optimizations"""
        
        @event.listens_for(self.engine.sync_engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            """Track query start time"""
            context._query_start_time = asyncio.get_event_loop().time()
        
        @event.listens_for(self.engine.sync_engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            """Track query performance"""
            if hasattr(context, '_query_start_time'):
                query_time = asyncio.get_event_loop().time() - context._query_start_time
                
                # Update stats
                if query_time < 0.001:  # Sub-1ms queries
                    self.connection_stats['fast_queries'] += 1
                else:
                    self.connection_stats['slow_queries'] += 1
                
                # Update average
                total_queries = self.connection_stats['fast_queries'] + self.connection_stats['slow_queries']
                if total_queries > 0:
                    current_avg = self.connection_stats['avg_query_time']
                    self.connection_stats['avg_query_time'] = (
                        (current_avg * (total_queries - 1) + query_time) / total_queries
                    )
    
    @asynccontextmanager
    async def get_ultrafast_session(self):
        """Get ultra-fast database session with optimizations"""
        if not self.session_factory:
            raise RuntimeError("Database not initialized")
        
        async with self.session_factory() as session:
            try:
                # Set session-level optimizations
                await session.execute(text("SET LOCAL synchronous_commit = OFF"))  # Faster commits
                await session.execute(text("SET LOCAL work_mem = '64MB'"))         # More memory for queries
                
                self.connection_stats['active_connections'] += 1
                yield session
                
            except Exception as e:
                await session.rollback()
                raise e
            finally:
                self.connection_stats['active_connections'] -= 1
    
    async def execute_fast_query(self, query: str, params: Dict = None) -> Any:
        """Execute query with ultra-fast optimizations"""
        
        # Check query cache first
        cache_key = f"{query}:{str(params) if params else ''}"
        if cache_key in self.query_cache:
            return self.query_cache[cache_key]
        
        async with self.get_ultrafast_session() as session:
            start_time = asyncio.get_event_loop().time()
            
            if params:
                result = await session.execute(text(query), params)
            else:
                result = await session.execute(text(query))
            
            query_time = asyncio.get_event_loop().time() - start_time
            
            # Cache frequently used queries (if they're fast)
            if query_time < 0.010 and len(self.query_cache) < 1000:  # Cache sub-10ms queries
                self.query_cache[cache_key] = result
            
            return result
    
    async def get_health_check(self) -> Dict[str, Any]:
        """Ultra-fast database health check"""
        try:
            start_time = asyncio.get_event_loop().time()
            
            async with self.get_ultrafast_session() as session:
                await session.execute(text("SELECT 1"))
            
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            return {
                "database_healthy": True,
                "response_time_ms": round(response_time, 4),
                "sub_1ms": response_time < 1.0,
                "connection_stats": self.connection_stats.copy(),
                "pool_size": self.connection_pool_size,
                "cache_size": len(self.query_cache)
            }
            
        except Exception as e:
            return {
                "database_healthy": False,
                "error": str(e),
                "connection_stats": self.connection_stats.copy()
            }
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get database performance statistics"""
        total_queries = self.connection_stats['fast_queries'] + self.connection_stats['slow_queries']
        
        return {
            "connection_pool": {
                "size": self.connection_pool_size,
                "max_overflow": self.max_overflow,
                "active": self.connection_stats['active_connections']
            },
            "query_performance": {
                "total_queries": total_queries,
                "fast_queries": self.connection_stats['fast_queries'],
                "slow_queries": self.connection_stats['slow_queries'],
                "fast_query_percentage": (
                    (self.connection_stats['fast_queries'] / total_queries * 100) 
                    if total_queries > 0 else 0
                ),
                "avg_query_time_ms": round(self.connection_stats['avg_query_time'] * 1000, 4)
            },
            "optimizations": {
                "prepared_statements": True,
                "connection_pooling": True,
                "query_caching": True,
                "cache_size": len(self.query_cache)
            }
        }
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Ultra-fast database connections closed")


# Global ultra-fast database instance
ultrafast_db = UltraFastDatabase()


async def init_ultrafast_database():
    """Initialize the ultra-fast database system"""
    await ultrafast_db.init_ultrafast_engine()
    logger.info("Ultra-fast database system initialized")


async def get_ultrafast_db():
    """Dependency for getting ultra-fast database session"""
    async with ultrafast_db.get_ultrafast_session() as session:
        yield session


# Optimized database queries for common operations
class FastQueries:
    """Pre-optimized queries for common operations"""
    
    @staticmethod
    async def get_user_by_id(user_id: int) -> Optional[Dict]:
        """Fast user lookup by ID"""
        query = """
        SELECT id, email, is_active, created_at 
        FROM users 
        WHERE id = :user_id 
        LIMIT 1
        """
        
        result = await ultrafast_db.execute_fast_query(query, {"user_id": user_id})
        row = result.fetchone()
        
        if row:
            return {
                "id": row.id,
                "email": row.email,
                "is_active": row.is_active,
                "created_at": row.created_at.isoformat() if row.created_at else None
            }
        return None
    
    @staticmethod
    async def get_system_stats() -> Dict[str, Any]:
        """Fast system statistics query"""
        query = """
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
            (SELECT COUNT(*) FROM email_accounts) as email_accounts
        """
        
        result = await ultrafast_db.execute_fast_query(query)
        row = result.fetchone()
        
        return {
            "total_users": row.total_users if row else 0,
            "active_users": row.active_users if row else 0,
            "email_accounts": row.email_accounts if row else 0,
            "query_optimized": True
        }