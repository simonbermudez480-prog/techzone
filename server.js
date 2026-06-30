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
        console.log(`Intentando descargar: ${url}`);
        
        // --- CAMBIOS CLAVE EN EL COMANDO ---
        // 1. --user-agent: Engaña a YouTube haciéndole creer que es un navegador Chrome.
        // 2. --js-exec node: Fuerza el uso de node para el JS runtime.
        const cmd = `yt-dlp --no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --js-exec "node" -f "best[ext=mp4]" "${url}" -o "${raw}"`;
        
        execSync(cmd);
        
        console.log("Descarga exitosa. Recortando...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        // Limpiamos el pesado
        if(fs.existsSync(raw)) fs.unlinkSync(raw);

        // Enviamos el archivo
        res.download(cut, 'video.mp4', (err) => {
            if (!err && fs.existsSync(cut)) fs.unlinkSync(cut);
        });
        
    } catch (e) {
        console.error("Error en /prepare:", e.message);
        // Si falla yt-dlp, es probable que sea por IP bloqueada.
        res.status(500).send("Fallo en descarga: " + e.message);
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


