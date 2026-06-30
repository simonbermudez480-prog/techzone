const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' }));

// Ruta para descargar y cortar (Paso 1)
app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;
    
    try {
        // Usamos --skip-download-key "js" para evitar el error de runtime JS
        execSync(`yt-dlp --skip-download-key "js" --geo-bypass --no-check-certificate -f "best[ext=mp4]" "${url}" -o "${raw}"`);
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.send("Video cortado exitosamente");
    } catch (e) { 
        res.status(500).send("Error en prepare: " + e.message); 
    }
});

// Ruta para quemar subtítulos y formato vertical (Paso 2)
app.post('/burn-subtitles', (req, res) => {
    const { id, srtContent } = req.body;
    const cut = `/tmp/${id}_cut.mp4`;
    const srt = `/tmp/${id}.srt`;
    const final = `/tmp/${id}_final.mp4`;

    try {
        fs.writeFileSync(srt, srtContent);
        // Comando corregido para formato 9:16 (1080x1920)
        const cmd = `ffmpeg -y -i "${cut}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles='${srt}':force_style='FontSize=24'" -c:v libx264 -preset ultrafast "${final}"`;
        execSync(cmd);
        
        res.download(final, 'final.mp4', () => {
            [cut, srt, final].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });
    } catch (e) { 
        res.status(500).send("Error en burn: " + e.message); 
    }
});

app.listen(process.env.PORT || 3000);
