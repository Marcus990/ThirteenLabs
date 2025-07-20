# 🚀 Thirteen Labs — From Video ➡️ Interactive 3D Scene

Transform any video into a live, animated 3D model using advanced AI — all in real-time, fully automated, and playable in the browser.

Demo:
[YouTube](https://youtu.be/i_b2p0VrURA)

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
- **Gemini / GPT-4o** — 3D model & animation code generation
- **FFmpeg** — Video preprocessing and frame slicing

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
  - [Gemini](https://ai.google.dev) or OpenAI

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

Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 🔐 .env Configuration

Create a `.env` file in `backend/`:

```env
TWELVE_LABS_API_KEY=your_twelve_labs_key
OPENAI_API_KEY=your_openai_or_gemini_key
```

---

## 🏗 Project Structure

```
thirteenlabs/
├── backend/
│   ├── main.py             # FastAPI app
│   ├── video_processing/   # FFmpeg and Twelve Labs utils
│   ├── ai_generation/      # Gemini or OpenAI 3D model logic
│   └── .env                # API keys
├── frontend/
│   ├── pages/              # Next.js routes
│   ├── components/         # React + Three.js views
│   └── public/demo-assets/ # Images for README
└── README.md
```

---

## 📋 Video Requirements

| Property      | Requirement             |
|---------------|--------------------------|
| Duration      | 4–10 seconds             |
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
