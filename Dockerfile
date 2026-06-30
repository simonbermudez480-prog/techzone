FROM nikolaik/python-nodejs:python3.11-nodejs18

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Aseguramos que yt-dlp esté al día
RUN pip install --upgrade yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Esto ayuda a que los subprocesos encuentren a node
ENV PATH="/usr/local/bin:${PATH}"

EXPOSE 3000
CMD [ "node", "server.js" ]
