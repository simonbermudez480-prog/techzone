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
        console.log(`Descargando: ${url}`);
        execSync(`yt-dlp --no-check-certificate -f "best[ext=mp4]" "${url}" -o "${raw}"`);
        
        console.log("Recortando...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        // BORRAR el original pesado, dejar solo el cortado
        if(fs.existsSync(raw)) fs.unlinkSync(raw);

        // --- AQUÍ ESTÁ EL CAMBIO ---
        // Enviamos el archivo directamente a n8n
        res.download(cut, 'video.mp4', (err) => {
            if (err) {
                console.error("Error al enviar archivo:", err);
            } else {
                // Borramos el archivo del servidor solo DESPUÉS de que se envió
                if(fs.existsSync(cut)) fs.unlinkSync(cut);
            }
        });
        
    } catch (e) {
        console.error("Error:", e.message);
        res.status(500).send("Error: " + e.message);
    }
});
app.post('/burn', (req, res) => {
    const { id, srtContent } = req.body;
    const cut = `/tmp/${id}_cut.mp4`;
    const srt = `/tmp/${id}.srt`;
    const final = `/tmp/${id}_final.mp4`;

    try {
        // 1. Guardar los subtítulos recibidos
        fs.writeFileSync(srt, srtContent);
        
        // 2. Quemar los subtítulos con ffmpeg
        // (Asegúrate de tener ffmpeg instalado en el Dockerfile)
        execSync(`ffmpeg -y -i "${cut}" -vf "subtitles='${srt}':force_style='FontSize=24'" -c:v libx264 -preset ultrafast "${final}"`);
        
        // 3. ENVIAR EL ARCHIVO FINAL
        res.download(final, 'video_final.mp4', () => {
            // Limpieza: borrar todo lo temporal al terminar
            [cut, srt, final].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });
        
    } catch (e) {
        console.error("Error en /burn:", e.message);
        res.status(500).send("Error procesando subtítulos: " + e.message);
    }
});
// --- 3. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));


