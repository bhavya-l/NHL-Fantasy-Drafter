# NHL Dream Team Drafter

A web application that allows users to build and manage a custom NHL roster using real player statistics from MoneyPuck.com.

## Requirements

- Python 3.8+
- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. PostgreSQL

Make sure PostgreSQL is running locally on port 5432. No password is required by default.

### 2. Backend

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python setup.py
python app.py
```

Flask will run at `http://127.0.0.1:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

React will run at `http://localhost:5173`.
