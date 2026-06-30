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

    // Comando estable y eficiente
    // Usamos -f "best[ext=mp4]" porque es el más compatible con el servidor
    const command = `yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}" && ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -c:v copy -c:a copy "${outputFileName}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', stderr);
            return res.status(500).send('Error en procesamiento: ' + stderr);
        }
        
        res.download(outputFileName, 'clip.mp4', (err) => {
            if (err) console.error(err);
            // Limpieza
            try { if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile); } catch(e) {}
            try { if (fs.existsSync(outputFileName)) fs.unlinkSync(outputFileName); } catch(e) {}
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
