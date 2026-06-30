const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');

// --- 1. DECLARACIÓN E INICIALIZACIÓN ---
const app = express();
app.use(express.json({ limit: '50mb' }));

// --- 2. RUTAS ---
app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;

    try {
        console.log(`Procesando: ${url}`);
        
        // Comando puro sin flags experimentales
        // yt-dlp detectará node automáticamente en esta imagen base
        execSync(`yt-dlp --no-check-certificate -f "best[ext=mp4]" "${url}" -o "${raw}"`);
        
        console.log("Recortando...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video listo");
    } catch (e) {
        console.error("Error en /prepare:", e.message);
        res.status(500).send("Error: " + e.message);
    }
});

// --- 3. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
