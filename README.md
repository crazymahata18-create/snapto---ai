# SnapTo AI — Intelligent Workplace Intelligence Platform

> AI-powered workplace monitoring that transforms CCTV feeds into intelligent workforce management — face recognition, behavior analysis, and automated incident reporting.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Open in browser
# Landing Page:  http://localhost:3000
# Dashboard:     http://localhost:3000/dashboard.html
# Login:         http://localhost:3000/login.html
# API Health:    http://localhost:3000/api/health
# WebSocket:     ws://localhost:3000/ws
```

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Director (full access) |
| `security` | `secure456` | Security Lead |
| `hr` | `hr789` | HR Manager |
| `demo` | `demo` | Viewer |

> You can also skip login and access the dashboard directly.

## Architecture

```
├── server.js              # Express + WebSocket server
├── ai/                    # AI simulation engine
│   ├── alertEngine.js     # Event-driven alert system
│   ├── faceRecognition.js # Face detection simulator
│   ├── behaviorAnalysis.js # Behavior analysis simulator
│   └── reportGenerator.js # Automated report builder
├── api/                   # REST API
│   ├── routes/            # 6 route modules
│   ├── middleware/         # Auth + rate limiting
│   └── data/mockData.js   # 41 employees, 12 cameras
└── public/                # Frontend
    ├── index.html         # Landing page
    ├── dashboard.html     # AI command dashboard
    ├── login.html         # Authentication
    ├── css/               # Design system + components
    └── js/                # API client, auth, dashboard, AI visualizer
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with credentials |
| GET | `/api/employees` | List employees (filter: `?status=working`) |
| GET | `/api/alerts` | Get alerts (filter: `?severity=danger`) |
| GET | `/api/analytics/snapshot` | Full analytics snapshot |
| GET | `/api/cameras` | List all cameras |
| POST | `/api/cameras/:id/scan` | **Trigger AI scan on a camera** |
| POST | `/api/reports/daily` | Generate daily report |
| GET | `/api/health` | System health check |

## How to Trigger AI Features

1. **AI Camera Scan**: Click any camera feed in the dashboard → AI scans the frame and detects faces with confidence scores
2. **Real-time Alerts**: Watch the right sidebar — new alerts appear automatically via WebSocket
3. **Generate Reports**: Click "Generate Daily Report" button in the dashboard
4. **Employee Status**: Watch the left sidebar — employee statuses update in real-time

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Auth**: JWT (jsonwebtoken)
- **Frontend**: Vanilla HTML/CSS/JS
- **AI**: Simulated pipeline (swappable with real ONNX/TensorFlow models)
- **Design**: Cyberpunk dark theme with Orbitron + Syne + Space Mono fonts

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

Built by the SnapTo AI Team © 2026
