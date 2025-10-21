# Use Python 3.11 Alpine as base image
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    postgresql-client \
    && addgroup -g 1001 -S appgroup \
    && adduser -S appuser -u 1001 -G appgroup

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./

# Change ownership to appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:${PORT:-3007}/health')"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-3007}"]
