from flask import Flask, request, jsonify
from flask_cors import CORS
from quixstreams import Application
from waitress import serve
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

output_topic_name = os.getenv('output')

# Initialize QuixStreams Application
quix_app = Application()
topic = quix_app.topic(name=output_topic_name, value_serializer='json')

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "I'm alive"}), 200

@app.route('/publish', methods=['POST'])
def publish_event():
    data = request.json
    if not data or 'sessionId' not in data or 'events' not in data:
        return jsonify({"error": "Invalid data provided"}), 400

    with quix_app.get_producer() as producer:
        for event in data['events']:
            message = topic.serialize(key=data['sessionId'], value=event)
            producer.produce(topic=topic.name, value=message.value, key=message.key)
    
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    # Debug print to check if the Flask app is starting
    print("Starting Flask server on port 80")
    serve(app, host="0.0.0.0", port=80)