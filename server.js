const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' }));

// Ruta de salud para que Railway sepa que el server está vivo
app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;

    try {
        console.log(`Iniciando descarga: ${url}`);
        execSync(`yt-dlp -f "best[ext=mp4]" "${url}" -o "${raw}"`);
        console.log("Descarga completa, iniciando recorte...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video listo");
    } catch (e) {
        console.error("Error crítico:", e);
        res.status(500).send("Error interno: " + e.message);
    }
});

// Arrancamos el server forzando el puerto que Railway asigne
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
