# 🚀 ThirteenLabs - AI Video to Interactive 3D Experience Converter

Transform any video into an interactive 3D experience using advanced AI technology. Upload a video and watch it become a live, moving 3D model you can explore in real time.

![ThirteenLabs Demo](https://youtu.be/i_b2p0VrURA)

## ✨ Features

- **🎥 Video Analysis**: Advanced AI analyzes your video to identify objects and actions
- **🎨 3D Reconstruction**: AI creates detailed 3D models from video content
- **🎮 Interactive Experience**: Instantly generate interactive 3D experiences with real-time rendering
- **⚡ Real-time Processing**: Fast processing pipeline with progress tracking
- **🎯 Professional Quality**: High-quality 3D rendering with modern graphics

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Celery** - Asynchronous task processing
- **Redis** - Message broker and caching
- **MoviePy** - Video processing and metadata extraction
- **OpenAI GPT-4o/3** - AI model generation
- **Twelve Labs API** - Video intelligence
- **FFmpeg** - Video frame extraction
- **OpenSCAD** - 3D model generation
- **Blender** - 3D model conversion

### Frontend
- **Next.js** - React framework with SSR
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics library
- **Lucide React** - Beautiful icons

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** and **Node.js 16+**
- **Redis** server running
- **API Keys**: Twelve Labs and OpenAI

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Thirteen-Labs-1
```

### 2. Start the Backend

```bash
cd backend
./start.sh
```

The backend will be available at: http://localhost:8000

### 3. Start the Frontend

```bash
cd frontend
./start.sh
```

The frontend will be available at: http://localhost:3000

### 4. Configure API Keys

Edit the `.env` file in the backend directory:

```bash
# Backend .env
TWELVE_LABS_API_KEY=your_twelve_labs_key
OPENAI_API_KEY=your_openai_key
```

## 📋 Video Requirements

- **Duration**: 4 seconds to 10 minutes
- **Format**: MP4 and MOV files
- **Size**: Maximum 500MB
- **Content**: Clear main object visible throughout the video

## 🎮 How It Works

1. **Upload Video** - Upload your MP4 or MOV video through the web interface
2. **AI Analysis** - Twelve Labs AI analyzes the video content
3. **3D Generation** - GPT models generate Three.js code for 3D objects
4. **Model Creation** - Interactive 3D experience is generated with real-time controls
5. **Explore** - Enjoy your custom interactive 3D experience!

## 🏗 Project Structure

```
Thirteen-Labs-1/
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── tasks/                  # Celery tasks
│   ├── utils/                  # Utility modules
│   ├── uploads/                # Video storage
│   ├── start.sh               # Backend startup script
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── pages/                 # Next.js pages
│   ├── components/            # React components
│   ├── lib/                   # Utility functions
│   ├── start.sh              # Frontend startup script
│   └── package.json          # Node.js dependencies
└── README.md
```

## 🔧 Development

### Backend Development

```bash
cd backend
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm run dev
```

### Celery Worker

```bash
cd backend
# Start Celery worker
celery -A celery_worker worker --loglevel=info
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📊 API Endpoints

- `POST /upload_video` - Upload and validate video
- `GET /status/{job_id}` - Check processing status
- `GET /game/{job_id}` - Get generated game
- `GET /health` - Health check

## 🎮 Customization

### Styling
The frontend uses Tailwind CSS with a custom color scheme:
- Primary: Purple (`#8b5cf6`) to Pink (`#ec4899`)
- Background: Dark slate gradient
- Accents: Purple and pink gradients

### 3D Rendering
The 3D viewer uses Three.js with:
- Enhanced lighting and shadows
- Tone mapping for realistic rendering
- Animated models and environments
- Responsive controls

## 🚨 Troubleshooting

### Common Issues

**Redis Connection Error**
```bash
# Start Redis
brew services start redis  # macOS
sudo systemctl start redis  # Ubuntu
```

**Port Already in Use**
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>
```

**Dependencies Issues**
```bash
# Backend
rm -rf venv/
./start.sh

# Frontend
rm -rf node_modules/
npm install
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation at http://localhost:8000/docs

---

**Built with ❤️ by ThirteenLabs Team**
