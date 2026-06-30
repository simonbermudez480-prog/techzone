# Imagen base profesional que ya trae Python 3.11 y Node.js 18
FROM nikolaik/python-nodejs:python3.11-nodejs18

# Instalar dependencias de sistema necesarias para video
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Asegurar que yt-dlp esté actualizado a la última versión
RUN pip install --upgrade yt-dlp

# Preparar la app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Arrancar el servidor
EXPOSE 3000
CMD [ "node", "server.js" ]
