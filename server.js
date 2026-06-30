const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/process-video', (req, res) => {
    const { url, inicio, fin, id, srtContent } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;
    const srt = `/tmp/${id}.srt`;
    const final = `/tmp/${id}_final.mp4`;

    try {
        // 1. Descarga con bypass de restricciones de YouTube
        execSync(`yt-dlp --geo-bypass --no-check-certificate -f "best[ext=mp4]" "${url}" -o "${raw}"`);
        
        // 2. Recorte
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        if(fs.existsSync(raw)) fs.unlinkSync(raw);

        // 3. Crear archivo SRT
        fs.writeFileSync(srt, srtContent);

        // 4. Quemar subtítulos + Formato Vertical 9:16
        // Escala a 1080x1920 con fondo negro de relleno
        const ffmpegCmd = `ffmpeg -y -i "${cut}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles='${srt}':force_style='FontSize=24'" -c:v libx264 -preset ultrafast "${final}"`;
        execSync(ffmpegCmd);

        // 5. Enviar y limpiar
        res.download(final, 'final.mp4', () => {
            [cut, srt, final].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });
    } catch (e) {
        res.status(500).send("Error en el servidor: " + e.message);
    }
});

app.listen(process.env.PORT || 3000);
