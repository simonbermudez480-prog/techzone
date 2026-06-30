const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    
    // Validación de parámetros
    if (!url || !inicio || !fin) {
        return res.status(400).send('Faltan parámetros: url, inicio o fin');
    }

    const outputFileName = '/tmp/output.mp4';
    const videoFile = '/tmp/video.mp4';

    // Comando optimizado: 
    // 1. Descarga el mejor MP4.
    // 2. FFmpeg corta el segmento y realiza el recorte vertical centrado (1080x1920).
    const command = `yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}" && ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:a copy "${outputFileName}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', stderr);
            return res.status(500).send('Error en procesamiento: ' + stderr);
        }
        
        // Enviar el archivo procesado al cliente
        res.download(outputFileName, 'clip_vertical.mp4', (err) => {
            if (err) console.error('Error al enviar archivo:', err);
            
            // Limpieza de archivos temporales
            try { if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile); } catch(e) {}
            try { if (fs.existsSync(outputFileName)) fs.unlinkSync(outputFileName); } catch(e) {}
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
