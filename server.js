const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');

// 1. PRIMERO: Inicializas la aplicación
const app = express();
app.use(express.json({ limit: '50mb' }));

// Ruta de salud para Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

// 2. DESPUÉS: Definas las rutas
app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;

    try {
        console.log(`Iniciando descarga: ${url}`);
        // Forzamos el uso de node como runtime para yt-dlp
        const cmd = `yt-dlp --js-exec "node" -f "best[ext=mp4]" "${url}" -o "${raw}"`;
        execSync(cmd);
        
        console.log("Descarga completada. Iniciando recorte...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video listo");
    } catch (e) {
        console.error("Error crítico:", e);
        res.status(500).send("Error interno: " + e.message);
    }
});

// 3. FINALMENTE: Escuchas el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
