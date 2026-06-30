const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path'); // <--- ESTO VA AQUÍ ARRIBA (Línea 4 aprox)

// --- 1. DECLARACIÓN E INICIALIZACIÓN ---
const app = express();
app.use(express.json({ limit: '50mb' }));

// --- 2. RUTAS ---
app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;
    
    // --- AQUÍ DEFINIMOS LA RUTA DE LAS COOKIES ---
   // --- DEBBUGING: Verificar Cookies ---
const cookiesPath = path.join(__dirname, 'cookies.txt');
const fileExists = fs.existsSync(cookiesPath);
console.log(`¿Existe el archivo de cookies?: ${fileExists}`);

if (fileExists) {
    const content = fs.readFileSync(cookiesPath, 'utf8');
    console.log(`Primeros 50 caracteres de cookies: ${content.substring(0, 50)}`);
} else {
    console.error("¡ERROR CRÍTICO! No se encuentra el archivo cookies.txt en: " + cookiesPath);
}

    try {
        console.log(`Descargando: ${url}`);
        
        // --- ESTE ES EL COMANDO QUE DEBES PONER DENTRO DE LA RUTA ---
        const cmd = `yt-dlp --no-check-certificate --cookies "${cookiesPath}" --extractor-args "youtube:player-client=android" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f "best[ext=mp4]" "${url}" -o "${raw}"`;
        
        execSync(cmd);
        
        console.log("Recortando...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);

        res.download(cut, 'video.mp4', (err) => {
            if (err) console.error("Error al enviar:", err);
            else if(fs.existsSync(cut)) fs.unlinkSync(cut);
        });
        
    } catch (e) {
        console.error("Error en /prepare:", e.message);
        res.status(500).send("Error: " + e.message);
    }
});

app.post('/burn', (req, res) => {
    const { id, srtContent } = req.body;
    const cut = `/tmp/${id}_cut.mp4`;
    const srt = `/tmp/${id}.srt`;
    const final = `/tmp/${id}_final.mp4`;

    try {
        fs.writeFileSync(srt, srtContent);
        execSync(`ffmpeg -y -i "${cut}" -vf "subtitles='${srt}':force_style='FontSize=24'" -c:v libx264 -preset ultrafast "${final}"`);
        
        res.download(final, 'video_final.mp4', () => {
            [cut, srt, final].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
        });
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
});

// --- 3. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
