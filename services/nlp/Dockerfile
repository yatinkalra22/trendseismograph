FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# Pre-download models on build for faster startup
RUN python -c "from transformers import pipeline; pipeline('zero-shot-classification', model='facebook/bart-large-mnli'); pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
