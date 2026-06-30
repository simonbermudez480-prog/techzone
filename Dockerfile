## Usamos una imagen base con soporte para Python moderno y Node.js
FROM nikolaik/python-nodejs:python3.11-nodejs18

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Actualizar pip y asegurar que yt-dlp es la versión más reciente
RUN pip install --upgrade pip && \
    pip install yt-dlp

# Configurar directorio de trabajo
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Exponer el puerto
EXPOSE 3000
CMD [ "node", "server.js" ]
