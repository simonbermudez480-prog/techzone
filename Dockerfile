FROM nikolaik/python-nodejs:python3.11-nodejs18

# Instalar ffmpeg y dependencias
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Asegurar que yt-dlp está actualizado
RUN pip install --upgrade yt-dlp

# Instalar nodejs explícitamente para que yt-dlp lo encuentre
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
