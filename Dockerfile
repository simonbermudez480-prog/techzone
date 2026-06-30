FROM nikolaik/python-nodejs:python3.11-nodejs18

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Instalamos la última versión directamente desde el repositorio
RUN pip install --upgrade --force-reinstall https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
