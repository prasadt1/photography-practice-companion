FROM python:3.12-slim

WORKDIR /app
COPY app/pyproject.toml app/uv.lock* /app/
RUN pip install uv && cd /app && uv sync --frozen 2>/dev/null || uv sync

COPY app /app
COPY services/change-stream-listener/main.py /listener/main.py

ENV PYTHONPATH=/app
# uv sync installs deps into /app/.venv — system python has no pymongo/dotenv
CMD ["/app/.venv/bin/python", "/listener/main.py"]
