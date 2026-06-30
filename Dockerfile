# Usamos una imagen base que ya trae Node.js
# Usamos una imagen base con una versión de Debian que soporta Python 3.11+
FROM nikolaik/python-nodejs:python3.11-nodejs18

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Actualizar pip y yt-dlp a la última versión
RUN pip install --upgrade pip && \
    pip install yt-dlp

# Configurar directorio de trabajo
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Exponer puerto y ejecutar
EXPOSE 3000
CMD [ "node", "server.js" ]
