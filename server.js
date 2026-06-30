const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    if (!url || !inicio || !fin) return res.status(400).send('Faltan parámetros');

    const outputFileName = '/tmp/output.mp4';
    const videoFile = '/tmp/video.mp4';

    // Usamos --no-check-certificate por si acaso y forzamos el formato
    const command = `yt-dlp -U && yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}" && ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset ultrafast -c:a aac "${outputFileName}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', stderr);
            return res.status(500).send('Error: ' + stderr);
        }
        res.download(outputFileName, 'clip_vertical.mp4', () => {
            try { if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile); } catch(e) {}
            try { if (fs.existsSync(outputFileName)) fs.unlinkSync(outputFileName); } catch(e) {}
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
