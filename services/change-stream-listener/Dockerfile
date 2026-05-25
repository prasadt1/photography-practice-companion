FROM python:3.12-slim

WORKDIR /app
COPY app/pyproject.toml app/uv.lock* /app/
RUN pip install uv && cd /app && uv sync --frozen 2>/dev/null || uv sync

COPY app /app
COPY services/change-stream-listener/main.py /listener/main.py

ENV PYTHONPATH=/app
CMD ["python", "/listener/main.py"]
