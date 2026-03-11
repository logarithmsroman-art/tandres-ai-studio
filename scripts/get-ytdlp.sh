#!/bin/bash
BIN_DIR="./bin"
mkdir -p $BIN_DIR

OS=$(uname -s)
ARCH=$(uname -m)

if [ "$OS" = "Linux" ]; then
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
elif [ "$OS" = "Darwin" ]; then
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
else
    echo "Unsupported OS: $OS"
    exit 1
fi

echo "Downloading yt-dlp standalone for $OS..."
curl -L $URL -o $BIN_DIR/yt-dlp
chmod +x $BIN_DIR/yt-dlp
echo "yt-dlp standalone binary ready at $BIN_DIR/yt-dlp"
