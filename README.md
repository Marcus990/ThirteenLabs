# 🚀 Thirteen Labs — From Video ➡️ Interactive 3D Scene

Transform any video into a live, animated 3D model using advanced AI — all in real-time, fully automated, and playable in the browser.

<p align="center">
  <img src="https://github.com/user-attachments/assets/95531432-f872-4d4f-9b11-e97c10f1645c" width="30%" />
  <img src="https://github.com/user-attachments/assets/54c96259-7adb-4af7-bab7-1b62e10d31b6" width="30%" />
  <img src="https://github.com/user-attachments/assets/c5914c0c-ab69-4941-b5b5-652095b4a46f" width="30%" />
</p>

---

## ▶️ Extended Demo

<div align="center">
  <a href="https://youtu.be/aazbH6jsu_s" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/user-attachments/assets/e763026c-5bd0-40be-a61e-b4a9e28e57c6" width="90%" alt="Watch the demo video on YouTube" />
  </a>
</div>

---

## 🎯 What is ThirteenLabs?

**ThirteenLabs** lets you upload a video and instantly experience it as a live 3D simulation — including object reconstruction, motion animation, and spatial interactivity.

Built for creators, engineers, educators, and game developers, this tool transforms video content into real-time game-ready 3D models, animated using natural language understanding and AI-generated Three.js code.

---

## ✨ Key Features

- 📹 **Video → 3D Pipeline**: Automatically converts a short video into a full 3D scene
- 🧠 **AI-Powered Object & Motion Extraction**: Identifies geometry, material, size, and dynamic movement
- 🎨 **Real-Time Three.js Rendering**: View and interact with the scene in-browser
- 🎮 **Playable Animation**: Includes flying, falling, rotation, and object transformation
- 🔄 **Modular Code Generation**: Outputs clean, reusable Three.js code for integration
- 💡 **No Manual 3D Work Needed**: End-to-end experience, from upload to scene

---

## 🛠 Tech Stack

### 🌐 Frontend
- **Next.js** — Fullstack React framework
- **Three.js** — 3D rendering and animation
- **Tailwind CSS** — UI styling
- **Framer Motion** — Animations
- **ShadCN / Lucide** — UI Components

### 🧠 Backend
- **FastAPI** — REST API server
- **Twelve Labs API** — Video intelligence (motion + object detection)
- **Gemini** — 3D model & animation code generation
- **FFmpeg** — Video preprocessing and frame slicing
- **Moviepy** - Video verification

---

## ⚙️ How It Works

1. **Upload a video** via the frontend
2. **Twelve Labs** analyzes object attributes and motion (position, speed, orientation)
3. **Gemini** generates spatial-aware object + motion description
4. Gemini returns **modular Three.js code** with animation tracks
5. Your browser renders the 3D scene instantly — with interaction

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- API keys for:
  - [Twelve Labs](https://docs.twelvelabs.io/)
  - [Gemini](https://ai.google.dev)
  - [Supabase](https://supabase.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/thirteenlabs.git
cd thirteenlabs
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

You can also choose to run ./start.sh for easier setup in both the frontend and backend directories.
Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 🔐 .env Configuration

Create a `.env` file in `backend/`:

```env
# API Keys
TWL_API_KEY=
TWL_INDEX_ID=
GEMINI_API_KEY=

# Server Configuration
HOST=0.0.0.0
PORT=8000

# File Upload Configuration
MAX_FILE_SIZE=104857600  # 100MB in bytes
UPLOAD_DIR=uploads 

# Database Configuration
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 🏗 Project Structure

```
thirteenlabs/
├── backend/
│   ├── main.py
│   ├── utils/    
│   ├── photos/
│   ├── uploads/  
│   └── .env
│   └── .requirements.txt
│   └── Dockerfile           
├── frontend/
│   ├── pages/           
│   ├── components/ 
│   └── lib/
│   └── styles/
│   └── types/
└── README.md
```

---

## 📋 Video Requirements

| Property      | Requirement             |
|---------------|--------------------------|
| Duration      | 4–10 minutes             |
| Format        | MP4 or MOV               |
| Size          | ≤ 500MB                  |
| Subject       | Clearly visible in frame |

---

## 💡 Example Use Cases

- 🔬 Visualize product demos in 3D from videos
- 🧱 Automatically create assets for indie game developers
- 📘 Turn educational videos into spatial learning tools
- 🎞️ Create interactive 3D versions of real-life actions
- 🛠 Prototype 3D motion concepts without Blender

---

## 🧪 Tips for Clean Results

- Keep the camera stable
- Ensure good lighting and visibility
- Record one main object in the frame
- Include full range of motion (e.g. if it rotates or falls)

---

## 🧠 Future Roadmap

- 🔁 Scene multi-object support
- 📐 Advanced spatial layout and perspective correction
- 🕹️ Game controller overlay
- 🎤 Prompt-guided AI edits (“make it fly higher”)
- 🌐 Export as GLTF or embed in your site

---

## 📝 License

MIT License © 2025 ThirteenLabs

---

## 🙌 Credits

Built by the **ThirteenLabs** team at [DevPost](https://devpost.com/software/video-3d-game-by-thirteen-labs)  

---
