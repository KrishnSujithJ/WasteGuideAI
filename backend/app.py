import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Try to import Firebase and Groq, but provide fallbacks if keys are missing
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    firebase_admin = None

try:
    from groq import Groq
except ImportError:
    Groq = None

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Firebase if credentials exist
db = None
if os.getenv("FIREBASE_CREDENTIALS_PATH") and firebase_admin:
    try:
        cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")

# Initialize Groq if API key exists
groq_client = None
if os.getenv("GROQ_API_KEY") and Groq:
    try:
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        print("Groq initialized successfully.")
    except Exception as e:
        print(f"Groq initialization failed: {e}")

# In-memory fallback database
local_history = []

def analyze_with_groq(item):
    if not groq_client:
        return None
    
    prompt = f"""
    Analyze the following waste item: "{item}".
    Provide a highly elaborative response. Respond ONLY with a valid JSON object matching this exact schema:
    {{
        "category": "String (e.g., Plastic Waste, Hazardous, E-Waste, Organic, Recyclable)",
        "hazard_warning": "String (optional, only if hazardous, else null)",
        "explanation": "String (A detailed 2-3 sentence paragraph explaining what this waste is composed of and its environmental impact)",
        "instructions": ["String (step 1)", "String (step 2)", "String (step 3)"],
        "eco_suggestion": "String (A practical tip to avoid generating this waste)",
        "upcycling_ideas": ["String (creative upcycling idea 1)", "String (creative upcycling idea 2)"],
        "recycling_difficulty": "String (Easy, Medium, Hard, or N/A)"
    }}
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API error: {e}")
        return None

def mock_analyze(item):
    item_lower = item.lower()
    if 'battery' in item_lower:
        return {
            "category": "Hazardous Waste",
            "hazard_warning": "Contains toxic heavy metals that can leak into soil and water.",
            "instructions": [
                "Do not throw in regular trash.",
                "Tape the ends of the battery.",
                "Take to a certified battery collection point or e-waste facility."
            ],
            "eco_suggestion": "Switch to rechargeable batteries to reduce waste."
        }
    elif 'plastic bottle' in item_lower:
        return {
            "category": "Plastic Waste",
            "hazard_warning": None,
            "instructions": [
                "Empty any remaining liquid.",
                "Rinse the bottle thoroughly.",
                "Remove the cap (if required by local guidelines).",
                "Place in the recycling bin."
            ],
            "eco_suggestion": "Switch to a reusable water bottle to reduce single-use plastic."
        }
    else:
        return {
            "category": "General Waste",
            "instructions": [
                "Check local guidelines if unsure.",
                "Dispose of in your regular trash bin."
            ],
            "eco_suggestion": "Try to reduce general waste by buying items with less packaging."
        }

@app.route('/api/scan', methods=['POST'])
def scan_item():
    data = request.json
    item = data.get('item')
    
    if not item:
        return jsonify({"error": "Item not provided"}), 400

    # Try Groq first, fallback to mock
    result = analyze_with_groq(item)
    if not result:
        result = mock_analyze(item)

    # Save to history
    record = {
        "item": item,
        "category": result.get("category"),
        "timestamp": datetime.now().isoformat()
    }
    
    if db:
        try:
            db.collection("history").add(record)
        except Exception as e:
            print(f"Failed to save to Firebase: {e}")
            local_history.append(record)
    else:
        local_history.append(record)

    return jsonify(result)

@app.route('/api/history', methods=['GET'])
def get_history():
    if db:
        try:
            docs = db.collection("history").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(100).stream()
            history = [doc.to_dict() for doc in docs]
            return jsonify(history)
        except Exception as e:
            print(f"Failed to fetch from Firebase: {e}")
            return jsonify(local_history)
    else:
        return jsonify(local_history)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
