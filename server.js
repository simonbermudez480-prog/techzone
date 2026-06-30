const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    
    // Validamos que los datos lleguen bien
    if (!url || !inicio || !fin) {
        return res.status(400).send('Faltan parámetros: url, inicio o fin');
    }

    // Usamos /tmp que es la carpeta temporal permitida en Railway
    const outputFileName = '/tmp/output.mp4';
    const videoFile = '/tmp/video.mp4';

    // Descarga y corta
    const command = `yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}" && ffmpeg -i "${videoFile}" -ss ${inicio} -to ${fin} -c copy "${outputFileName}"`;

    exec(command, (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error procesando el video: ' + error.message);
        }
        
        res.download(outputFileName, 'clip.mp4', (err) => {
            if (err) console.error(err);
            // Limpieza
            try { fs.unlinkSync(videoFile); fs.unlinkSync(outputFileName); } catch(e) {}
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
