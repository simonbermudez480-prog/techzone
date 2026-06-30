const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    if (!url || !inicio || !fin) return res.status(400).send('Faltan datos');

    const outputFileName = '/tmp/output.mp4';
    const videoFile = '/tmp/video.mp4';

    // Usamos --skip-download-archive para evitar verificaciones extra
    // y --no-playlist para ir directo al video
    const command = `yt-dlp --no-check-certificate --skip-download-archive --no-playlist -f "best[ext=mp4]" "${url}" -o "${videoFile}" && ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -c:v copy -c:a copy "${outputFileName}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', stderr);
            return res.status(500).send('Error procesando el video: ' + stderr);
        }
        
        res.download(outputFileName, 'clip.mp4', (err) => {
            if (err) console.error(err);
            try { fs.unlinkSync(videoFile); fs.unlinkSync(outputFileName); } catch(e) {}
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
