const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/cut', (req, res) => {
    const { url, inicio, fin } = req.body;
    const videoFile = '/tmp/video.mp4';
    const audioFile = '/tmp/audio.mp3';
    const srtFile = '/tmp/subtitles.srt';
    const outputFileName = '/tmp/output_sub.mp4';

    try {
        // 1. Descargar
        execSync(`yt-dlp -f "best[ext=mp4]" "${url}" -o "${videoFile}"`);
        
        // 2. Cortar y convertir a vertical
        execSync(`ffmpeg -y -i "${videoFile}" -ss ${inicio} -to ${fin} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:a aac "${outputFileName}"`);

        // 3. Generar subtítulos con Whisper
        execSync(`whisper "${outputFileName}" --model small --output_format srt --output_dir /tmp/`);
        
        // 4. Incrustar subtítulos (Estilo "Viral")
        // Nota: usamos un filtro de FFmpeg para poner el texto centrado y llamativo
        const finalFile = '/tmp/final.mp4';
        execSync(`ffmpeg -y -i "${outputFileName}" -vf "subtitles=${srtFile}:force_style='Alignment=2,OutlineColour=&H000000&,Outline=3,Shadow=2,FontSize=20'" -c:a copy "${finalFile}"`);

        res.download(finalFile, 'clip_viral.mp4');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en procesamiento de subtítulos');
    }
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
