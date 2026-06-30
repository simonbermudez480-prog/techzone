const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    const outputFileName = 'output.mp4';

    // Comando para descargar y cortar usando yt-dlp y ffmpeg
    const command = `yt-dlp -f "best[ext=mp4]" "${url}" -o "video.mp4" && ffmpeg -i video.mp4 -ss ${inicio} -to ${fin} -c copy ${outputFileName}`;

    exec(command, (error) => {
        if (error) return res.status(500).send('Error procesando el video');
        
        // Enviamos el archivo resultante a n8n
        res.download(outputFileName, (err) => {
            if (err) console.log(err);
            // Limpieza: borrar archivos temporales
            fs.unlinkSync('video.mp4');
            fs.unlinkSync(outputFileName);
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
