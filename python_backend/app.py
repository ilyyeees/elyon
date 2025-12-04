from flask import Flask, request, jsonify
import pandas as pd
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import time
import sys

app = Flask(__name__)

current_data = None
user_creds = {}

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    global current_data
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    try:
        current_data = pd.read_csv(file)
        preview_data = current_data.head(5).to_dict(orient='records')

        return jsonify({
            "status": "success",
            "count": len(current_data),
            "columns": list(current_data.columns),
            "preview": preview_data
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/render-preview', methods=['POST'])
def render_preview():
    global current_data
    if current_data is None:
        return jsonify({"status": "error", "message": "No data loaded"}), 400

    try:
        template_text = request.json.get('body', '')
        first_row = current_data.iloc[0].to_dict()

        template = Template(template_text)
        rendered = template.render(**first_row)

        return jsonify({"preview": rendered})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/verify-credentials', methods=['POST'])
def verify_credentials():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    host = data.get('host', 'smtp.gmail.com')
    port = int(data.get('port', 587))

    try:
        server = smtplib.SMTP(host, port)
        server.starttls()
        server.login(email, password)
        server.quit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 401

@app.route('/send-batch', methods=['POST'])
def send_batch():
    global current_data
    if current_data is None:
        return jsonify({"status": "error", "message": "No data loaded"}), 400

    creds = request.json.get('credentials', {})
    email = creds.get('email')
    password = creds.get('password')
    host = creds.get('host', 'smtp.gmail.com')
    port = int(creds.get('port', 587))

    email_col = request.json.get('email_column', 'Email')
    body_str = request.json.get('body', '')
    subject_str = request.json.get('subject', '')

    def generate():
        try:
            server = smtplib.SMTP(host, port)
            server.starttls()
            server.login(email, password)

            template_body = Template(body_str)
            template_subject = Template(subject_str)

            for index, row in current_data.iterrows():
                try:
                    recipient = row.get(email_col)
                    if not recipient:
                        yield f"data: Skipping row {index}: No email found in column '{email_col}'\n\n"
                        continue

                    msg = MIMEMultipart()
                    msg['From'] = email
                    msg['To'] = recipient
                    msg['Subject'] = template_subject.render(**row)

                    body = template_body.render(**row)
                    msg.attach(MIMEText(body, 'html'))

                    server.send_message(msg)

                    yield f"data: Sent to {recipient}\n\n"
                except Exception as e:
                    yield f"data: Error sending to {row.get(email_col, 'Unknown')}: {str(e)}\n\n"

                time.sleep(1)

            server.quit()
        except Exception as e:
            yield f"data: Critical Error: {str(e)}\n\n"

    return app.response_class(generate(), mimetype='text/event-stream')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running"})

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    sys.stdout.flush()
    app.run(port=5000)
