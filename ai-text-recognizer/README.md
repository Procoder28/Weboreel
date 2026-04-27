# TextTruth AI — AI vs Human Text Detector

A full-stack web app that predicts whether text is human-written or AI-generated.

## Tech Stack
- Frontend: React 18 + Tailwind CSS (single `index.html`, no build step)
- Backend: Flask API
- Model: `roberta-base-openai-detector` (HuggingFace) with heuristic fallback

## Project Structure
```
ai-text-recognizer/
├── app.py
├── index.html
├── requirements.txt
├── sample_texts.txt
└── README.md
```

## Local Run

### 1. Create and activate environment
```bash
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Start app
```bash
python app.py
```

Open `http://localhost:5000`.

> First run may download the model (~500MB). If it fails, the app falls back automatically to heuristic detection.

## Production Deployment

This project is deployable as a single web service (Flask serves both API and `index.html`).

### Option A: Render (recommended)

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Configure:
  - Runtime: Python
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `gunicorn app:app`
4. Add optional env vars:
  - `FLASK_DEBUG=false`
5. Deploy and open the generated URL.

### Option B: Railway

1. Create a new Railway project from the GitHub repo.
2. Set start command to:
  - `gunicorn app:app`
3. Railway provides `PORT` automatically; app reads it.
4. Deploy and open the public URL.

### Option C: Any VPS (Ubuntu)

```bash
sudo apt update
sudo apt install -y python3 python3-venv

git clone <your-repo-url>
cd ai-text-recognizer

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

gunicorn app:app --bind 0.0.0.0:5000
```

Put Nginx/Caddy in front for HTTPS and domain routing.

## API Reference

### `POST /predict`

**Request:**
```json
{ "text": "Your text to analyze..." }
```

**Response:**
```json
{
  "label": "AI Generated",
  "confidence": 87.3,
  "ai_score": 87.3,
  "explanation": "High confidence this text was AI-generated. Heuristic analysis detected: ...",
  "model_used": "roberta-base-openai-detector"
}
```

### `GET /health`
Returns server status and which model is loaded.

## Features
- AI/Human classification with confidence score
- Animated ring confidence meter
- Dark/Light mode toggle
- History of last 5 checks (localStorage)
- Download results as text report
- Sample texts to try
- Responsive design

## Sample Test Texts
See `sample_texts.txt` for ready-to-use examples.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot reach backend" | Ensure service is running and check logs |
| Model download fails | Heuristic fallback is used automatically |
| Out of memory | Keep using heuristic mode or move to larger instance |
