FROM node:18-bookworm

# Instalamos dependencias necesarias para audio y video
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Instalamos whisper y yt-dlp
RUN pip3 install --upgrade pip
RUN pip3 install openai-whisper yt-dlp --break-system-packages

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
