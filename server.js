const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;
    
    try {
        // Comando simplificado y universal
        execSync(`yt-dlp -f "best[ext=mp4]" "${url}" -o "${raw}"`);
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video preparado");
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.post('/burn-subtitles', (req, res) => {
    const { id, srtContent } = req.body;
    const cut = `/tmp/${id}_cut.mp4`;
    const srt = `/tmp/${id}.srt`;
    const final = `/tmp/${id}_final.mp4`;

    try {
        fs.writeFileSync(srt, srtContent);
        execSync(`ffmpeg -y -i "${cut}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles='${srt}':force_style='FontSize=24'" -c:v libx264 -preset ultrafast "${final}"`);
        res.download(final, 'final.mp4', () => {
            [cut, srt, final].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.listen(3000);
