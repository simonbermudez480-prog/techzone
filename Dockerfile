FROM nikolaik/python-nodejs:python3.11-nodejs18
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade yt-dlp
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node", "server.js" ]
