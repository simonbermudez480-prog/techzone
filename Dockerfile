# Mantenemos la base de Playwright que es muy robusta
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Instalamos Python, FFmpeg y AHORA TAMBIÉN nodejs y npm
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp y asegurarlo
RUN pip3 install --upgrade yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
