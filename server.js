const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    if (!url || !inicio || !fin) return res.status(400).send('Faltan parámetros');

    const videoFile = '/tmp/video.mp4';
    const outputFileName = '/tmp/output_sub.mp4';
    const srtFile = '/tmp/output_sub.srt';
    const finalFile = '/tmp/final.mp4';

    try {
        // 1. Descarga y corte directo (ya sabemos que funciona bien)
        execSync(`yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}"`);
        execSync(`ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset ultrafast -c:a aac "${outputFileName}"`);

        // 2. Generación de subtítulos con modelo 'tiny' (muy rápido)
        execSync(`whisper "${outputFileName}" --model tiny --output_format srt --output_dir /tmp/`);
        
        // 3. Incrustado rápido
        execSync(`ffmpeg -y -i "${outputFileName}" -vf "subtitles='${srtFile}':force_style='FontSize=24,PrimaryColour=&H00FFFF&'" -c:a copy "${finalFile}"`);

        res.download(finalFile, 'clip_viral.mp4', () => {
             // Limpieza
             [videoFile, outputFileName, srtFile, finalFile].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error procesando subtítulos: ' + error.message);
    }
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
