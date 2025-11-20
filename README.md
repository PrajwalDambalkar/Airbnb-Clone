# 🏠 Airbnb Clone

A microservices-based Airbnb clone featuring AI-powered travel planning.

## 🚀 Quick Start (Recommended)

Follow these steps to run the entire project locally.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
*   [Node.js](https://nodejs.org/) (v18+) installed (for running the frontend).

### 1. Setup Environment Variables

**Root Directory**:
Copy the example environment file in the root directory:
```bash
cp env.example .env
```
*No changes needed for a quick start, but feel free to review `MONGODB_URI` if you want to use a local DB instead of the provided Atlas fallback.*

**Frontend Directory**:
Navigate to the frontend app and set up its environment:
```bash
cd apps/frontend
cp env.example .env
```
**IMPORTANT**: Open `apps/frontend/.env` and update the `VITE_API_URL` to match the Docker backend port:
```env
VITE_API_URL=http://localhost:5001
```

### 2. Start Backend & Services (Docker)

From the root of the project (where `docker-compose.yml` is), run:

```bash
docker-compose up -d --build
```

This will start:
*   **Backend API Gateway**: `http://localhost:5001`
*   **Microservices**: Traveler, Owner, Property, Booking services.
*   **AI Agent Service**: `http://localhost:8000`
*   **Ollama**: (AI Model Provider)

### 3. Initialize AI Model (One-time setup)

The AI agent depends on the Llama 3 model. You need to pull it into the running Ollama container:

```bash
docker exec -it ollama ollama pull llama3
```
*Note: This may take a few minutes depending on your internet speed (approx 4GB).*

### 4. Start Frontend

The frontend is run natively for better development experience.

```bash
cd apps/frontend
npm install
npm run dev
```

Access the application at: **[http://localhost:5173](http://localhost:5173)**

---

## 🏗️ Architecture Overview

*   **Frontend**: React + Vite + Tailwind CSS (`http://localhost:5173`)
*   **Backend**: Node.js + Express (`http://localhost:5001`)
*   **AI Agent**: Python + FastAPI + LangChain (`http://localhost:8000`)
*   **Database**: MongoDB (Atlas by default, configurable to local)
*   **AI Engine**: Ollama (running Llama 3)

## 🛠️ Troubleshooting

### Frontend can't connect to Backend?
*   Ensure `apps/frontend/.env` has `VITE_API_URL=http://localhost:5001`.
*   Check if the backend is running: `docker ps`.

### AI Agent is not replying?
*   Ensure you ran `docker exec -it ollama ollama pull llama3`.
*   Check agent logs: `docker logs agent-service`.

### Database connection errors?
*   The project uses a shared MongoDB Atlas instance by default. If this is restricted, install MongoDB locally and update `MONGODB_URI` in `.env` files to point to `mongodb://host.docker.internal:27017/...`.

### Port Conflicts?
*   **5001**: Backend API
*   **8000**: AI Agent
*   **11434**: Ollama
*   **5173**: Frontend
*   Ensure these ports are free before starting.
