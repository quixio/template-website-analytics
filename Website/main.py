import os
from flask import Flask, request, Response, send_from_directory
from waitress import serve
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)

@app.route("/")
def index():
    return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    serve(app, host="localhost", port=8081)