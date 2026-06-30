FROM nikolaik/python-nodejs:python3.11-nodejs18

# Instalar ffmpeg y dependencias necesarias
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Asegurar que yt-dlp es la versión más reciente
RUN pip install --upgrade yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Exponer el puerto
EXPOSE 3000
CMD [ "node", "server.js" ]
