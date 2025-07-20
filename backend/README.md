# ThirteenLabs Backend

## Prerequisites

### FFmpeg Installation

The screenshot functionality requires FFmpeg to be installed on your system.

#### Quick Install (macOS/Linux)
```bash
# Run the installation script
chmod +x install_ffmpeg.sh
./install_ffmpeg.sh
```

#### Manual Installation

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Apple Silicon Mac (M1/M2) - Recommended:**
```bash
# Install Homebrew for Apple Silicon
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to your shell profile
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile

# Install FFmpeg
brew install ffmpeg
```

**Apple Silicon Mac (M1/M2) - Alternative (Intel Homebrew):**
```bash
# If you have Intel Homebrew installed
arch -x86_64 brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**CentOS/RHEL:**
```bash
sudo yum install ffmpeg
```

**Windows:**
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

### Python Dependencies

Install the required Python packages:
```bash
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the backend directory with:
```
TWL_API_KEY=your_twelve_labs_api_key
TWL_INDEX_ID=your_twelve_labs_index_id
```

## Running the Backend

```bash
python3 main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /upload_video` - Upload a video for analysis
- `GET /status/{task_id}` - Check processing status
- `GET /result/{task_id}` - Get analysis results
- `GET /health` - Health check

## Features

- Video upload and validation
- Twelve Labs AI analysis
- Automatic screenshot generation at key timestamps
- Orthographic view extraction
- Static file serving for screenshots 