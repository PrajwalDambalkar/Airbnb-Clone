# 🏠 Airbnb Clone - Full-Stack Vacation Rental Platform

A feature-rich, full-stack vacation rental platform inspired by Airbnb, built with modern web technologies including React, Node.js, MySQL, and AI-powered travel planning.

![Airbnb Clone](https://img.shields.io/badge/Tech-MERN%20Stack-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [AI Agent Features](#-ai-agent-features)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Contributors](#-contributors)

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Secure signup/login with session management
- 🏘️ **Property Listings** - Browse, search, and filter vacation rentals
- 📅 **Booking System** - Real-time availability checking and booking management
- 👤 **User Profiles** - Customizable profiles with profile picture uploads
- 🌓 **Dark Mode** - Full dark/light theme support across the application
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS

### Advanced Features
- 🤖 **AI Travel Assistant** - Intelligent chatbot for trip planning
- 🗺️ **AI-Powered Itineraries** - Personalized day-by-day travel plans
- 🌤️ **Real-Time Weather** - Live weather forecasts via Tavily API
- 📍 **POI Recommendations** - AI-curated points of interest
- 🍽️ **Restaurant Suggestions** - Dietary preference-aware dining options
- 📚 **Policy Q&A Bot** - RAG-powered policy information retrieval
- 💬 **Conversational AI** - Natural language interaction with Llama 3

### Owner Features
- 🏠 **Property Management** - Add, edit, and delete property listings
- 📸 **Photo Uploads** - Multiple image uploads per property
- 📊 **Booking Dashboard** - View and manage incoming bookings
- ✅ **Booking Status Control** - Approve or reject booking requests

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon system
- **Axios** - HTTP client

### Backend
- **Node.js** with Express.js
- **MySQL 8** - Relational database
- **Express Session** - Session management
- **Multer** - File upload handling
- **Cors** - Cross-origin resource sharing

### AI/ML Services
- **Python FastAPI** - AI agent service
- **Ollama + Llama 3** - Local LLM inference
- **LangChain** - LLM orchestration framework
- **ChromaDB** - Vector database for RAG
- **Sentence Transformers** - Text embeddings
- **Tavily API** - Web search and weather data
- **PyPDF2** - PDF policy document processing

### DevOps & Tools
- **Git** - Version control
- **npm/pip** - Package management
- **ESLint** - Code linting
- **dotenv** - Environment configuration

## 📁 Project Structure

```
Airbnb Clone/
├── apps/
│   ├── frontend/              # React + Vite application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page components
│   │   │   ├── services/      # API service layer
│   │   │   ├── context/       # React context providers
│   │   │   └── App.tsx        # Main app component
│   │   ├── public/            # Static assets
│   │   └── package.json
│   │
│   ├── backend/               # Node.js + Express API
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Custom middleware
│   │   ├── uploads/           # User uploaded files
│   │   └── package.json
│   │
│   └── agent-service/         # Python AI agent service
│       ├── main.py            # FastAPI application
│       ├── routes/            # API endpoints
│       ├── services/          # Business logic
│       ├── rag/               # RAG implementation
│       ├── utils/             # Utility functions
│       ├── models/            # Data models
│       ├── policies/          # PDF policy documents
│       └── requirements.txt
│
├── Doc Help/                  # Documentation and guides
├── package.json               # Workspace configuration
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MySQL 8** - [Download](https://dev.mysql.com/downloads/)
- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Ollama** - [Download](https://ollama.ai/) (for AI features)
- **Git** - [Download](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PrajwalDambalkar/Airbnb-Clone.git
   cd Airbnb-Clone
   ```

2. **Install frontend dependencies**
   ```bash
   cd apps/frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd apps/backend
   npm install
   ```

4. **Install AI agent dependencies**
   ```bash
   cd apps/agent-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Set up MySQL database**
   ```sql
   CREATE DATABASE airbnb_db;
   ```
   
   Run the provided SQL schema file to create tables.

6. **Install Ollama and pull Llama 3 model**
   ```bash
   # Install Ollama from https://ollama.ai/
   ollama pull llama3
   ```

## 🔧 Environment Setup

### Frontend (.env)
Create `apps/frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

### Backend (.env)
Create `apps/backend/.env`:
```env
# Database
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_db
DB_PORT=3306

# Session
SESSION_SECRET=your-secret-key-here

# Agent Service
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=your-secret-key-here

# Server
PORT=5001
```

### AI Agent Service (.env)
Create `apps/agent-service/.env`:
```env
# Database
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_db
DB_PORT=3306

# Agent Service Secret (must match backend)
AGENT_SERVICE_SECRET=your-secret-key-here

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Tavily API for Web Search (Optional but recommended)
# Get free API key from: https://tavily.com/
TAVILY_API_KEY=your_tavily_api_key_here

# ChromaDB
CHROMA_PATH=./chroma_db

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## ▶️ Running the Application

### Method 1: Run All Services Separately

1. **Start the backend server** (Terminal 1)
   ```bash
   cd apps/backend
   npm run dev
   ```
   Backend runs on: http://localhost:5001

2. **Start the frontend** (Terminal 2)
   ```bash
   cd apps/frontend
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

3. **Start the AI agent service** (Terminal 3)
   ```bash
   cd apps/agent-service
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   AI Service runs on: http://localhost:8000

### Method 2: Using the Startup Script

```bash
./start.sh  # On Windows: start.bat
```

## 🤖 AI Agent Features

### Travel Planning Assistant
- **Natural Conversation**: Chat naturally about your travel plans
- **Smart Intent Recognition**: Understands booking queries, trip planning, policy questions
- **Context Awareness**: Remembers conversation history for coherent dialogue

### Personalized Itineraries
- **Day-by-Day Plans**: Structured morning/afternoon/evening activities
- **POI Integration**: Real-time points of interest from Tavily web search
- **Weather Forecasts**: Accurate weather predictions for travel dates
- **Restaurant Recommendations**: Filtered by dietary preferences
- **Packing Lists**: AI-generated based on activities and weather
- **Local Tips**: Insider knowledge for better travel experience

### RAG-Powered Policy Q&A
- **Instant Answers**: Query cancellation, payment, and privacy policies
- **Semantic Search**: Understands questions in natural language
- **Source Attribution**: Shows relevant policy sections
- **Vector Storage**: ChromaDB for efficient similarity search

### Technical Implementation
- **LLM**: Llama 3 (8B parameters) running locally via Ollama
- **Embeddings**: all-MiniLM-L6-v2 for vector representations
- **Web Search**: Tavily API for real-time information
- **Framework**: LangChain for LLM orchestration
- **Fallback System**: Graceful degradation when services unavailable

## 📚 API Documentation

### Backend API Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status

#### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (owner only)
- `PUT /api/properties/:id` - Update property (owner only)
- `DELETE /api/properties/:id` - Delete property (owner only)

#### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking status (owner only)

#### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### AI Agent API Endpoints

#### Chat Interface
- `POST /agent/chat` - Send message to AI agent
  ```json
  {
    "user_id": 1,
    "booking_id": 21,
    "message": "Plan my trip to Los Angeles",
    "conversation_history": []
  }
  ```

#### Health & Status
- `GET /health` - Service health check
- `GET /` - API information

## 📸 Screenshots

### Home Page
Beautiful property listings with search and filter functionality

### AI Travel Assistant
Interactive chatbot for personalized travel planning

### Booking Dashboard
Manage your bookings and view trip details

### Dark Mode
Full application support for dark theme

## 👥 Contributors

- **Prajwal Dambalkar** - Lead Developer
- [GitHub Profile](https://github.com/PrajwalDambalkar)

## 📝 Project Documentation

For more detailed documentation, see:
- `AI_AGENT_QUICKSTART.md` - Quick start guide for AI features
- `AI_AGENT_SETUP.md` - Complete AI agent setup
- `ENVIRONMENT_SETUP.md` - Environment configuration guide
- `POLICY_RAG_IMPLEMENTATION.md` - RAG system details

## 🐛 Troubleshooting

### Common Issues

**MySQL Connection Errors**
- Ensure MySQL is running: `mysql.server start` (Mac) or `net start mysql` (Windows)
- Check credentials in `.env` files
- Verify database exists: `SHOW DATABASES;`

**Ollama Not Responding**
- Check if Ollama is running: `ollama list`
- Verify model is downloaded: `ollama pull llama3`
- Test generation: `ollama run llama3 "test"`

**Port Already in Use**
- Kill process on port: `lsof -ti:5001 | xargs kill -9` (Mac/Linux)
- Or use different ports in environment variables

**AI Agent Taking Too Long**
- Llama 3 8B can take 2-4 minutes for complex generation
- Consider using smaller model: `ollama pull phi3:mini`
- Or upgrade to GPU-accelerated inference

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Airbnb for the inspiration
- Ollama team for local LLM inference
- Tavily for web search API
- LangChain for LLM orchestration framework
- OpenAI for AI research and development

---

**Note**: This is an educational project created for learning purposes. It is not affiliated with or endorsed by Airbnb, Inc.

## 🔗 Links

- [Live Demo](#) (if deployed)
- [Report Bug](https://github.com/PrajwalDambalkar/Airbnb-Clone/issues)
- [Request Feature](https://github.com/PrajwalDambalkar/Airbnb-Clone/issues)

---

Made with ❤️ by Prajwal Dambalkar
