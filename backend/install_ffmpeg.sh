#!/bin/bash

echo "🔧 Installing FFmpeg for ThirteenLabs..."

# Detect operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Detected macOS"
    
    # Check for Apple Silicon vs Intel
    if [[ $(uname -m) == "arm64" ]]; then
        echo "🍎 Detected Apple Silicon (M1/M2) Mac"
        # Check for Apple Silicon Homebrew
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            echo "🍺 Using Apple Silicon Homebrew..."
            export PATH="/opt/homebrew/bin:$PATH"
        elif command -v brew &> /dev/null; then
            echo "🍺 Using Intel Homebrew with Rosetta..."
            echo "🍺 Installing FFmpeg via Homebrew (Intel version)..."
            arch -x86_64 brew install ffmpeg
        else
            echo "❌ Homebrew not found. Installing for Apple Silicon..."
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo "   After installation, run: echo 'eval \"\$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zprofile"
            echo "   Then restart your terminal and run this script again."
            exit 1
        fi
    else
        echo "🖥️  Detected Intel Mac"
        if command -v brew &> /dev/null; then
            echo "🍺 Using Homebrew..."
        else
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    fi
    
    # Only install if we didn't already install with arch -x86_64
    if [[ $(uname -m) != "arm64" ]] || [[ ! -f "/usr/local/bin/brew" ]]; then
        echo "🍺 Installing FFmpeg via Homebrew..."
        brew install ffmpeg
    fi
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    if command -v apt-get &> /dev/null; then
        echo "📦 Installing FFmpeg via apt-get..."
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    elif command -v yum &> /dev/null; then
        echo "📦 Installing FFmpeg via yum..."
        sudo yum install -y ffmpeg
    else
        echo "❌ Package manager not found. Please install FFmpeg manually."
        exit 1
    fi
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "💡 Please install FFmpeg manually from: https://ffmpeg.org/download.html"
    exit 1
fi

echo "✅ FFmpeg installation complete!"
echo "🔍 Verifying installation..."
ffmpeg -version

if [ $? -eq 0 ]; then
    echo "🎉 FFmpeg is ready to use!"
else
    echo "❌ FFmpeg installation may have failed. Please check manually."
    echo "💡 Try running: brew doctor"
fi 