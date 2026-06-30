const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' })); // Permitir subtítulos largos

// 1. Paso de Preparación: Descarga, corta y extrae audio
app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    if (!url || !id) return res.status(400).send('Faltan parámetros');

    const videoRaw = `/tmp/${id}_raw.mp4`;
    const videoCut = `/tmp/${id}_cut.mp4`;
    const audioFile = `/tmp/${id}.mp3`;

    // Descarga, corta a vertical y extrae audio
    const command = `yt-dlp --user-agent "Mozilla/5.0..." --geo-bypass -f "best[ext=mp4]" "${url}" -o "${videoRaw}" && ffmpeg -y -i "${videoRaw}" -ss ${inicio} -to ${fin} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset ultrafast "${videoCut}" && ffmpeg -y -i "${videoCut}" -vn -acodec libmp3lame -q:a 2 "${audioFile}"`;

    exec(command, (error) => {
        if (error) return res.status(500).send('Error en preparación: ' + error.message);
        res.download(audioFile, 'audio.mp3', () => {
            if (fs.existsSync(videoRaw)) fs.unlinkSync(videoRaw); // Limpiar el video original pesado
        });
    });
});

// 2. Paso de Subtitulado: Recibe el texto y lo aplica
app.post('/burn-subtitles', (req, res) => {
    const { id, srtContent } = req.body; // srtContent es el texto que te da OpenAI
    const srtFile = `/tmp/${id}.srt`;
    const videoCut = `/tmp/${id}_cut.mp4`;
    const finalFile = `/tmp/${id}_final.mp4`;

    fs.writeFileSync(srtFile, srtContent);

    const command = `ffmpeg -y -i "${videoCut}" -vf "subtitles='${srtFile}':force_style='FontSize=24,PrimaryColour=&H00FFFF&'" -c:v libx264 -preset ultrafast -c:a copy "${finalFile}"`;

    exec(command, (error) => {
        if (error) return res.status(500).send('Error quemando subs: ' + error.message);
        res.download(finalFile, 'final.mp4', () => {
            // Limpieza final
            [srtFile, videoCut, finalFile].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });
    });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
