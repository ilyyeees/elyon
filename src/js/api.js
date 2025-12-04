const API_URL = 'http://localhost:5000';

class ElyonAPI {
    static async checkHealth() {
        try {
            const res = await fetch(`${API_URL}/health`);
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    static async uploadCSV(file) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/upload-csv`, {
            method: 'POST',
            body: formData
        });
        return await res.json();
    }

    static async renderPreview(body, subject) {
        const res = await fetch(`${API_URL}/render-preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body, subject })
        });
        return await res.json();
    }

    static async verifyCredentials(email, password, host, port) {
        const res = await fetch(`${API_URL}/verify-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, host, port })
        });
        return res;
    }

    static getEventSource(body, subject, credentials, emailColumn) {
        // For SSE, we can't send a body in a GET request easily,
        // but our backend expects POST for send-batch.
        // Standard EventSource doesn't support POST.
        // We will use fetch with a reader for this implementation to handle the stream.
        return fetch(`${API_URL}/send-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body, subject, credentials, email_column: emailColumn })
        });
    }
}

// Expose to window for easy access
window.ElyonAPI = ElyonAPI;
