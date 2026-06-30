app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;

    try {
        console.log(`Iniciando descarga: ${url}`);
        // Comando simplificado: yt-dlp detectará node automáticamente
        const cmd = `yt-dlp -f "best[ext=mp4]" "${url}" -o "${raw}"`;
        execSync(cmd);
        
        console.log("Descarga completada. Iniciando recorte...");
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video listo");
    } catch (e) {
        console.error("Error crítico:", e);
        res.status(500).send("Error interno: " + e.message);
    }
});
