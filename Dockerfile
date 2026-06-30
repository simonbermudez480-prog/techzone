FROM node:18-bookworm

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    yt-dlp \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
