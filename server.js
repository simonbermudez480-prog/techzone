const express = require('express');
const { exec } = require('child_process');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    const outputFileName = '/tmp/output.mp4';
    const videoFile = '/tmp/video.mp4';

    // Usamos --user-agent para parecer un navegador real y evitar bloqueos
    // Quitamos la lógica compleja de formatos
    const command = `yt-dlp --user-agent "Mozilla/5.0" "${url}" -o "${videoFile}" && ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -c copy "${outputFileName}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', stderr); // Esto nos dirá exactamente por qué falló
            return res.status(500).send('Error: ' + stderr);
        }
        res.download(outputFileName, 'clip.mp4');
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
