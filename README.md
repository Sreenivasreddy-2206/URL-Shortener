# URL Shortener

A clean, responsive, and fully functional URL Shortener web application built with **React.js**, **Node.js**, and **Express.js**. It stores all URL mappings persistently using a self-contained local JSON database located entirely within the project directory.

---

## Features

- **Generate Short URLs:** Instantly convert long, cumbersome URLs into compact 6-character links.
- **Direct Redirection:** Visiting a shortened link automatically redirects (HTTP 302) to the destination.
- **Persistent Storage:** All shortened links are automatically stored in `server/data/urls.json` within the project. No cloud dependencies or external database setups required.
- **One-Click Copy:** Copy button with instant visual confirmation ("Copied!").
- **Input Validation:** Clear validation checks for empty inputs, invalid protocols, or malformed URLs.
- **Minimal, Responsive UI:** Professional, lightweight design with a light theme that works across desktop and mobile screens.

---

## Tech Stack

- **Frontend:** React 19, Vite, Vanilla CSS
- **Backend:** Node.js, Express 4, CORS, Dotenv
- **Storage:** Local JSON database with atomic writes (persisted in `server/data/urls.json`)

---

## Project Structure

```
URL shortener/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx             # Main application UI & state
│   │   ├── App.css             # Clean, minimal light-mode styling
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Global typography & reset
│   ├── index.html
│   ├── vite.config.js          # Vite config with API proxy
│   └── package.json
├── server/                     # Backend (Node.js + Express)
│   ├── data/
│   │   └── urls.json           # Local persistent database
│   ├── src/
│   │   ├── config/storage.js   # Atomic JSON storage engine
│   │   ├── routes/urlRoutes.js # API endpoints (/api/shorten, /api/health)
│   │   ├── utils/
│   │   │   ├── generateCode.js # Random alphanumeric code generator
│   │   │   └── urlValidator.js # URL format validation
│   │   └── server.js           # Express app setup & redirect handler
│   ├── tests/
│   │   └── api.test.js         # Automated end-to-end API test suite
│   ├── .env                    # Server environment variables
│   ├── .env.example
│   └── package.json
├── scripts/
│   └── dev.js                  # Unified dev server launcher
├── package.json                # Root orchestration scripts
└── README.md                   # Documentation
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

---

## Setup & Installation

### Option 1: Quick Install (from root)

Run the following command from the root folder:

```bash
npm run install:all
```

### Option 2: Step-by-Step Install

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

---

## Running the Application

### Option 1: Run Both Concurrently (Recommended)

From the project root:

```bash
npm run dev
```

This starts:
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Frontend App:** [http://localhost:5173](http://localhost:5173)

### Option 2: Run Separately in Two Terminals

**Terminal 1 (Backend):**
```bash
cd server
npm run start
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open your browser and navigate to:
**[http://localhost:5173](http://localhost:5173)**

---

## Environment Variables

The backend configuration is located in `server/.env`:

| Variable    | Default Value               | Description                                |
| ----------- | --------------------------- | ------------------------------------------ |
| `PORT`      | `5000`                      | Port Express server listens on             |
| `BASE_URL`  | `http://localhost:5000`     | Base URL prefix used for shortened links   |
| `DATA_PATH` | `./data/urls.json`          | Relative/absolute path to JSON data store  |
| `NODE_ENV`  | `development`               | Runtime environment                       |

---

## Running Automated Tests

To execute the test suite (validating API endpoints, duplicate handling, redirect status, invalid inputs, and persistence):

```bash
npm test
```

---

## API Reference

### 1. Shorten URL
- **Endpoint:** `POST /api/shorten`
- **Request Body:**
  ```json
  {
    "url": "https://example.com/long-page-address"
  }
  ```
- **Success Response (201 / 200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "m1abcd...",
      "urlCode": "X8k9zQ",
      "originalUrl": "https://example.com/long-page-address",
      "shortUrl": "http://localhost:5000/X8k9zQ",
      "createdAt": "2026-10-22T11:30:00.000Z"
    },
    "isExisting": false
  }
  ```

### 2. Redirect to Original URL
- **Endpoint:** `GET /:code` (e.g. `GET http://localhost:5000/X8k9zQ`)
- **Response:** HTTP `302 Found` with `Location: <originalUrl>`
- If code is not found, returns HTTP `404 Not Found`.

### 3. Health Check
- **Endpoint:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-22T11:30:00.000Z"
  }
  ```
