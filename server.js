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

    // Comando simplificado: yt-dlp descarga, ffmpeg corta
    const command = `yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}" && ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -c:v libx264 -c:a aac "${outputFileName}"`;

    exec(command, (error) => {
        if (error) return res.status(500).send('Error en procesamiento: ' + error.message);
        
        res.download(outputFileName, 'clip.mp4', () => {
            try { fs.unlinkSync(videoFile); fs.unlinkSync(outputFileName); } catch(e) {}
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
