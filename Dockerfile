FROM nikolaik/python-nodejs:python3.11-nodejs18

# Solo instalamos lo estrictamente necesario
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Actualizamos yt-dlp a la versión más reciente desde el repo
RUN pip install --upgrade --force-reinstall https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
