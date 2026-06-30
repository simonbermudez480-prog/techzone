# Esta imagen ya trae Python 3.11 y Node.js instalados.
FROM nikolaik/python-nodejs:python3.11-nodejs18

# Solo necesitamos instalar ffmpeg.
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Actualizar yt-dlp a la última versión
RUN pip install --upgrade yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
