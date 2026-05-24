# Coach API for Cloud Run (build from repo root: docker build -t practice-companion-api .)
FROM python:3.12-slim-bookworm

WORKDIR /srv/app

RUN pip install --no-cache-dir uv

COPY app/pyproject.toml app/uv.lock ./
RUN uv sync --frozen --no-dev

COPY app/ ./
COPY principles/ /srv/principles/

ENV PYTHONUNBUFFERED=1
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health')"

CMD ["uv", "run", "uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8080"]
