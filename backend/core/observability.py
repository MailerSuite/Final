"""
Comprehensive observability system for SGPT backend
Provides structured logging, metrics, and tracing with OpenTelemetry
"""

import logging
import sys
from contextlib import asynccontextmanager
from typing import Any

import structlog

# OpenTelemetry imports - TEMPORARILY COMMENTED OUT FOR QUICK START
from opentelemetry import metrics, trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
    OTLPMetricExporter,
)
from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
    OTLPSpanExporter,
)
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from config.settings import settings

# Global observability components - TEMPORARILY DISABLED
tracer: trace.Tracer | None = None
# tracer = None  # Temporarily set to None
meter: metrics.Meter | None = None
# meter = None  # Temporarily set to None
logger: structlog.BoundLogger | None = None


class ObservabilityManager:
    """Manages observability setup including logging, metrics, and tracing"""

    def __init__(self):
        self.tracer_provider: TracerProvider | None = None
        self.meter_provider: MeterProvider | None = None
        self.is_initialized = False

    def setup_structured_logging(self) -> structlog.BoundLogger:
        """Setup structured logging with JSON format"""
        if not settings.ENABLE_STRUCTURED_LOGGING:
            return self._setup_basic_logging()

        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer(),
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

        # Configure standard library logging
        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=getattr(logging, settings.LOG_LEVEL),
        )

        # Create structured logger
        global logger
        logger = structlog.get_logger("sgpt")

        # Add trace context to logs
        if settings.ENABLE_TRACING:
            logger = logger.bind(
                service_name=settings.OTEL_SERVICE_NAME,
                service_version=settings.OTEL_SERVICE_VERSION,
            )

        return logger

    def _setup_basic_logging(self) -> structlog.BoundLogger:
        """Setup basic logging when structured logging is disabled"""
        logging.basicConfig(
            level=getattr(logging, settings.LOG_LEVEL),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )
        global logger
        logger = structlog.get_logger("sgpt")
        return logger

    def setup_tracing(self):
        """Setup OpenTelemetry tracing"""
        global tracer
        # tracer = None  # Temporarily set to None # REMOVED
        if not settings.ENABLE_TRACING:
            return None
        # return None # REMOVED

        try:
            # Create resource
            resource = Resource.create(
                {
                    "service.name": settings.OTEL_SERVICE_NAME,
                    "service.version": settings.OTEL_SERVICE_VERSION,
                    "deployment.environment": "development"
                    if settings.DEBUG
                    else "production",
                }
            )

            # Create tracer provider
            self.tracer_provider = TracerProvider(resource=resource)

            # Setup span processor based on exporter type
            if settings.OTEL_TRACES_EXPORTER == "jaeger":
                span_processor = BatchSpanProcessor(
                    JaegerExporter(
                        agent_host_name="localhost",
                        agent_port=6831,
                    )
                )
            elif settings.OTEL_TRACES_EXPORTER == "otlp":
                span_processor = BatchSpanProcessor(
                    OTLPSpanExporter(
                        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT
                    )
                )
            else:
                # Default to console exporter for development
                from opentelemetry.sdk.trace.export import ConsoleSpanExporter

                span_processor = BatchSpanProcessor(ConsoleSpanExporter())

            self.tracer_provider.add_span_processor(span_processor)

            # Set global tracer provider
            trace.set_tracer_provider(self.tracer_provider)

            # Create tracer
            global tracer
            tracer = trace.get_tracer(settings.OTEL_SERVICE_NAME)
            return tracer

        except Exception as e:
            print(f"Failed to setup tracing: {e}")
            return None

    def setup_metrics(self):
        """Setup OpenTelemetry metrics"""
        global meter
        # meter = None  # Temporarily set to None # REMOVED
        if not settings.ENABLE_METRICS:
            return None
        # return None # REMOVED

        try:
            # Create resource
            resource = Resource.create(
                {
                    "service.name": settings.OTEL_SERVICE_NAME,
                    "service.version": settings.OTEL_SERVICE_VERSION,
                }
            )

            # Setup metric reader based on exporter type
            if settings.OTEL_METRICS_EXPORTER == "prometheus":
                # PrometheusMetricReader no longer accepts port parameter
                # Use prometheus_client.start_http_server() to expose metrics
                from prometheus_client import start_http_server
                try:
                    start_http_server(settings.OTEL_EXPORTER_PROMETHEUS_PORT)
                except OSError:
                    # Port already in use, skip
                    pass
                metric_reader = PrometheusMetricReader()
            elif settings.OTEL_METRICS_EXPORTER == "otlp":
                metric_reader = PeriodicExportingMetricReader(
                    OTLPMetricExporter(
                        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT
                    )
                )
            else:
                # Default to console exporter for development
                from opentelemetry.sdk.metrics.export import (
                    ConsoleMetricExporter,
                )

                metric_reader = PeriodicExportingMetricReader(
                    ConsoleMetricExporter()
                )

            # Create meter provider
            self.meter_provider = MeterProvider(
                resource=resource, metric_readers=[metric_reader]
            )

            # Set global meter provider
            metrics.set_meter_provider(self.meter_provider)

            # Create meter
            global meter
            meter = metrics.get_meter(settings.OTEL_SERVICE_NAME)

            return meter

        except Exception as e:
            print(f"Failed to setup metrics: {e}")
            return None

    def instrument_fastapi(self, app):
        """Instrument FastAPI application with OpenTelemetry"""
        # TEMPORARILY DISABLED - OpenTelemetry imports commented out # REMOVED
        # return # REMOVED
        if not settings.ENABLE_TRACING:
            return

        try:
            FastAPIInstrumentor.instrument_app(app)
        except Exception as e:
            print(f"Failed to instrument FastAPI: {e}")

    def instrument_sqlalchemy(self, engine):
        """Instrument SQLAlchemy with OpenTelemetry"""
        # TEMPORARILY DISABLED - OpenTelemetry imports commented out # REMOVED
        # return # REMOVED
        if not settings.ENABLE_TRACING:
            return

        try:
            SQLAlchemyInstrumentor().instrument(engine=engine)
        except Exception as e:
            print(f"Failed to instrument SQLAlchemy: {e}")

    def instrument_requests(self):
        """Instrument requests library with OpenTelemetry"""
        # TEMPORARILY DISABLED - OpenTelemetry imports commented out # REMOVED
        # return # REMOVED
        if not settings.ENABLE_TRACING:
            return

        try:
            RequestsInstrumentor().instrument()
        except Exception as e:
            print(f"Failed to instrument requests: {e}")

    def instrument_logging(self):
        """Instrument logging with OpenTelemetry"""
        if not settings.ENABLE_TRACING:
            return

        try:
            LoggingInstrumentor().instrument(
                set_logging_format=True, log_level=logging.INFO
            )
        except Exception as e:
            print(f"Failed to instrument logging: {e}")

    def initialize(self) -> dict[str, Any]:
        """Initialize all observability components"""
        if self.is_initialized:
            return {"status": "already_initialized"}

        results = {
            "logging": "disabled",
            "tracing": "disabled",
            "metrics": "disabled",
        }

        # Setup logging
        try:
            self.setup_structured_logging()
            results["logging"] = "enabled"
        except Exception as e:
            results["logging"] = f"failed: {e}"

        # Setup tracing
        if settings.ENABLE_TRACING:
            try:
                self.setup_tracing()
                results["tracing"] = "enabled"
            except Exception as e:
                results["tracing"] = f"failed: {e}"

        # Setup metrics
        if settings.ENABLE_METRICS:
            try:
                self.setup_metrics()
                results["metrics"] = "enabled"
            except Exception as e:
                results["metrics"] = f"failed: {e}"

        self.is_initialized = True
        return results

    def get_health_status(self) -> dict[str, Any]:
        """Get observability health status"""
        return {
            "initialized": self.is_initialized,
            "tracing_enabled": settings.ENABLE_TRACING and tracer is not None,
            "metrics_enabled": settings.ENABLE_METRICS and meter is not None,
            "logging_enabled": settings.ENABLE_STRUCTURED_LOGGING
            and logger is not None,
            "service_name": settings.OTEL_SERVICE_NAME,
            "service_version": settings.OTEL_SERVICE_VERSION,
        }


# Global observability manager instance
observability_manager = ObservabilityManager()


def get_logger() -> structlog.BoundLogger:
    """Get the global structured logger"""
    if logger is None:
        observability_manager.setup_structured_logging()
    return logger


def get_tracer():  # -> trace.Tracer | None: - TEMPORARILY DISABLED
    """Get the global tracer"""
    return tracer


def get_meter():  # -> metrics.Meter | None: - TEMPORARILY DISABLED
    """Get the global meter"""
    return meter


@asynccontextmanager
async def trace_span(name: str, attributes: dict[str, Any] | None = None):
    """Context manager for creating trace spans"""
    if not tracer:
        yield
        return

    with tracer.start_as_current_span(
        name, attributes=attributes or {}
    ) as span:
        try:
            yield span
        except Exception as e:
            span.record_exception(e)
            # span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))  # TEMPORARILY DISABLED
            raise


def log_with_context(message: str, level: str = "info", **kwargs):
    """Log message with trace context"""
    if not logger:
        get_logger()

    # Add trace context if available
    if tracer and settings.ENABLE_TRACING:
        # current_span = trace.get_current_span()  # TEMPORARILY DISABLED
        current_span = None
        if current_span:
            span_context = current_span.get_span_context()
            kwargs.update(
                {
                    "trace_id": format(span_context.trace_id, "032x"),
                    "span_id": format(span_context.span_id, "016x"),
                }
            )

    log_method = getattr(logger, level.lower())
    log_method(message, **kwargs)
