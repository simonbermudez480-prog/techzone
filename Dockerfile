FROM node:18-bookworm

# Instalamos ffmpeg y las herramientas necesarias de una sola vez
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# Creamos un entorno virtual para python para evitar el error PEP 668
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalamos las librerías dentro del entorno virtual
RUN pip install --no-cache-dir openai-whisper yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
