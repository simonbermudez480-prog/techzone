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
    // --- COPIA Y PEGA ESTO EN TU SERVIDOR ---

// Asegúrate de que el nombre del archivo use el ID
const rawFile = `/tmp/${id}_raw.mp4`; 
const cutFile = `/tmp/${id}_cut.mp4`; 

// ... (aquí ejecutas tu lógica de descarga o FFmpeg) ...

// ESTO ES LO QUE DEBES DEVOLVER A N8N
res.json({
    status: "success",
    id: id,
    rawFile: rawFile,
    cutFile: cutFile
});
    // --- AQUÍ DEFINIMOS LA RUTA DE LAS COOKIES ---
   // --- DEBBUGING: Verificar Cookies ---
// Añadir esto antes de tu execSync(cmd) en /prepare
const cookiesPath = '/app/cookies.txt'; // Ruta fija en el contenedor
const fs = require('fs');

if (fs.existsSync(cookiesPath)) {
    console.log("¡ÉXITO! El archivo cookies.txt existe en /app/");
    const stats = fs.statSync(cookiesPath);
    console.log(`Tamaño del archivo: ${stats.size} bytes`);
} else {
    console.error("¡ERROR CRÍTICO! No se encuentra cookies.txt en /app/");
    // Listamos el contenido de /app para ver dónde diablos está
    console.log("Contenido de /app:", fs.readdirSync('/app'));
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
