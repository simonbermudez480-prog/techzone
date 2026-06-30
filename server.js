app.post('/prepare', (req, res) => {
    const { url, inicio, fin, id } = req.body;
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;

    try {
        // Ejecutamos el comando forzando el uso de 'node' como runtime
        // Esto soluciona: "No supported JavaScript runtime"
        const cmd = `yt-dlp --js-exec "node" -f "best[ext=mp4]" "${url}" -o "${raw}"`;
        execSync(cmd);
        
        // Recortar con ffmpeg
        execSync(`ffmpeg -y -i "${raw}" -ss ${inicio} -to ${fin} -c copy "${cut}"`);
        
        if(fs.existsSync(raw)) fs.unlinkSync(raw);
        res.status(200).send("Video listo");
        
    } catch (e) {
        // Aquí evitamos que el servidor se caiga (502)
        console.error("Error crítico durante la descarga:", e.message);
        res.status(500).send("Error interno del servidor: " + e.message);
    }
});
