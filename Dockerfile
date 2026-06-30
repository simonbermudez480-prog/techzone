FROM nikolaik/python-nodejs:python3.11-nodejs18

# Instalamos dependencias necesarias para que yt-dlp no sufra
RUN apt-get update && apt-get install -y ffmpeg curl python3-pip && rm -rf /var/lib/apt/lists/*

# Aseguramos la última versión de yt-dlp
RUN pip install --upgrade yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
