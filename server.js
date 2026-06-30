app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;

    try {
        console.log(`Iniciando descarga de: ${url}`);
        
        // --- AQUÍ ES DONDE VA EL COMANDO JS (DENTRO DEL EXECSYNC) ---
        // Este es el comando exacto que soluciona el error de "runtime" y "bot"
        const cmd = `yt-dlp --js-exec "node" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f "best[ext=mp4]" "${url}" -o "${raw}"`;
        execSync(cmd);
        // -----------------------------------------------------------

        console.log("Descarga completada. Iniciando ffmpeg...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video listo");
    } catch (e) {
        console.error("Error detectado:", e);
        res.status(500).send("Error interno: " + e.message);
    }
});
