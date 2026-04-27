from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import re

app = Flask(__name__)
CORS(app)

# Try to load the HuggingFace model, fall back to heuristic if unavailable
model = None
tokenizer = None

def load_model():
    global model, tokenizer
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch
        print("Loading roberta-base-openai-detector model...")
        tokenizer = AutoTokenizer.from_pretrained("roberta-base-openai-detector")
        model = AutoModelForSequenceClassification.from_pretrained("roberta-base-openai-detector")
        model.eval()
        print("Model loaded successfully.")
        return True
    except Exception as e:
        print(f"Could not load HuggingFace model: {e}")
        print("Falling back to heuristic detector.")
        return False

MODEL_LOADED = load_model()


def heuristic_detector(text):
    """
    Fallback heuristic detector when HuggingFace model is unavailable.
    Scores text on several linguistic features common in AI-generated content.
    """
    score = 0.0
    reasons = []

    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    if not words:
        return 50.0, "Insufficient text"

    # 1. Sentence length consistency (AI tends to be more uniform)
    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        avg = sum(lengths) / len(lengths)
        variance = sum((l - avg) ** 2 for l in lengths) / len(lengths)
        if variance < 15:
            score += 20
            reasons.append("uniform sentence lengths")
        elif variance < 30:
            score += 10

    # 2. Transition words (AI overuses them)
    transitions = ["furthermore", "moreover", "additionally", "consequently",
                   "therefore", "however", "nevertheless", "in conclusion",
                   "to summarize", "it is worth noting", "it should be noted",
                   "in addition", "as a result", "on the other hand",
                   "first and foremost", "last but not least"]
    text_lower = text.lower()
    transition_count = sum(1 for t in transitions if t in text_lower)
    if transition_count >= 3:
        score += 25
        reasons.append("heavy use of transition phrases")
    elif transition_count >= 1:
        score += 10

    # 3. Filler phrases typical of AI
    ai_phrases = ["delve into", "it is important to", "play a crucial role",
                  "in today's world", "in the realm of", "a testament to",
                  "navigate the", "tapestry of", "leverage", "robust",
                  "holistic", "paradigm", "synergy", "utilize", "facilitate",
                  "comprehensive", "multifaceted", "it's worth mentioning"]
    ai_count = sum(1 for p in ai_phrases if p in text_lower)
    if ai_count >= 3:
        score += 20
        reasons.append("AI-typical vocabulary")
    elif ai_count >= 1:
        score += 8

    # 4. Avg word length (AI tends slightly longer)
    avg_word_len = sum(len(w) for w in words) / len(words)
    if avg_word_len > 5.5:
        score += 10
        reasons.append("longer average word length")

    # 5. Lack of contractions (AI avoids them)
    contractions = ["don't", "can't", "won't", "it's", "they're", "you're",
                    "we're", "I'm", "isn't", "aren't", "wasn't", "weren't",
                    "I've", "I'd", "I'll", "that's"]
    contraction_count = sum(1 for c in contractions if c.lower() in text_lower)
    if contraction_count == 0 and len(words) > 50:
        score += 15
        reasons.append("no contractions")
    elif contraction_count <= 1 and len(words) > 100:
        score += 7

    # 6. Exclamation marks / informal punctuation (humans use more)
    informal = text.count('!') + text.count('...') + len(re.findall(r'\b(lol|haha|wow|omg|btw|tbh)\b', text_lower))
    if informal >= 2:
        score -= 20
    elif informal >= 1:
        score -= 8

    # 7. Personal pronouns (humans use more I/me/my)
    personal = len(re.findall(r'\b(I|me|my|myself|I\'m|I\'ve|I\'d|I\'ll)\b', text))
    if personal >= 5:
        score -= 15
    elif personal >= 2:
        score -= 7

    score = max(0, min(100, score))
    reason_text = (", ".join(reasons[:3]) if reasons else "balanced writing style")

    return score, reason_text


def predict_with_model(text):
    """Use HuggingFace transformer model for prediction."""
    import torch
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)

    # roberta-base-openai-detector: label 0 = Real (Human), label 1 = Fake (AI)
    ai_prob = probs[0][1].item() * 100
    return ai_prob


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text'].strip()
    if len(text) < 20:
        return jsonify({'error': 'Text too short. Please provide at least 20 characters.'}), 400

    try:
        if MODEL_LOADED:
            ai_score = predict_with_model(text)
            explanation = "Analyzed using RoBERTa-based OpenAI detector model."
        else:
            ai_score, features = heuristic_detector(text)
            explanation = f"Heuristic analysis detected: {features}."

        label = "AI Generated" if ai_score >= 50 else "Human Written"
        confidence = round(ai_score if ai_score >= 50 else 100 - ai_score, 1)

        if label == "AI Generated":
            if confidence >= 85:
                explanation_prefix = "High confidence this text was AI-generated."
            elif confidence >= 65:
                explanation_prefix = "This text shows several AI-writing patterns."
            else:
                explanation_prefix = "Slight AI-writing indicators detected."
        else:
            if confidence >= 85:
                explanation_prefix = "High confidence this text was written by a human."
            elif confidence >= 65:
                explanation_prefix = "This text shows mostly human writing characteristics."
            else:
                explanation_prefix = "Slight lean toward human authorship."

        return jsonify({
            'label': label,
            'confidence': confidence,
            'ai_score': round(ai_score, 1),
            'explanation': f"{explanation_prefix} {explanation}",
            'model_used': 'roberta-base-openai-detector' if MODEL_LOADED else 'heuristic'
        })

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': MODEL_LOADED,
        'model': 'roberta-base-openai-detector' if MODEL_LOADED else 'heuristic-fallback'
    })


@app.route('/', methods=['GET'])
def home():
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host=host, port=port, debug=debug)
