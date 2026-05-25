"""OpenTelemetry spans for MongoDB MCP read operations."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import os

from opentelemetry import trace

_TRACER_PROVIDER_READY = False


def ensure_cloud_trace_export() -> None:
    """Register Cloud Trace exporter on Cloud Run so mongodb.mcp.* spans are visible."""
    global _TRACER_PROVIDER_READY
    if _TRACER_PROVIDER_READY or not os.environ.get("K_SERVICE"):
        return
    try:
        from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        provider = TracerProvider()
        provider.add_span_processor(BatchSpanProcessor(CloudTraceSpanExporter()))
        trace.set_tracer_provider(provider)
        _TRACER_PROVIDER_READY = True
    except Exception:
        pass


ensure_cloud_trace_export()
TRACER = trace.get_tracer("practice_companion.mcp_reads")


@contextmanager
def mcp_read_span(
    span_name: str,
    *,
    tool_name: str,
    collection: str,
    query_size_bytes: int = 0,
) -> Iterator[Any]:
    """
    Span names: mongodb.mcp.find | mongodb.mcp.find_one | mongodb.mcp.aggregate
    """
    with TRACER.start_as_current_span(span_name) as span:
        span.set_attribute("mcp.tool_name", tool_name)
        span.set_attribute("mcp.transport", "http")
        span.set_attribute("mongodb.collection", collection)
        if query_size_bytes:
            span.set_attribute("mongodb.query_size_bytes", query_size_bytes)
        yield span
