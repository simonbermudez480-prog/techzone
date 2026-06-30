const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const app = express();
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => res.status(200).send('OK'));

function safeId(id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('ID inválido');
    return id;
}

async function descargarConReintentos(url, raw, cookiesPath, maxRetries = 3) {
    const args = [
        '--no-check-certificate',
        '--cookies', cookiesPath,
        '--extractor-args', 'youtube:player_client=android',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--sleep-requests', '2',
        '--sleep-interval', '3',
        '--max-sleep-interval', '10',
        '-f', 'best[ext=mp4]',
        '-o', raw,
        url
    ];

    for (let intento = 1; intento <= maxRetries; intento++) {
        try {
            await execFileAsync('yt-dlp', args, { timeout: 120000 });
            return;
        } catch (e) {
            const msg = e.stderr || e.message || '';
            const es429 = msg.includes('429') || msg.includes('Too Many Requests');
            console.error(`Intento ${intento}/${maxRetries} falló:`, msg.slice(0, 300));
            if (intento === maxRetries) throw e;
            const espera = es429 ? intento * 8000 : intento * 3000;
            console.log(`Esperando ${espera}ms antes de reintentar...`);
            await new Promise(r => setTimeout(r, espera));
        }
    }
}

// --- Construye el filtro de ffmpeg según el formato deseado ---
function buildVerticalFilter(formato) {
    // 1080x1920 = 9:16, estándar para Reels/TikTok/Shorts
    if (formato === 'blur') {
        // Fondo difuminado + video original centrado encima
        return [
            '-filter_complex',
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=20[bg];" +
            "[0:v]scale=1080:-2[fg];" +
            "[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p"
        ];
    }
    // Default: crop centrado, sin franjas, recorta los bordes
    return [
        '-vf',
        "crop='if(gt(iw/ih,9/16),ih*9/16,iw)':'if(gt(iw/ih,9/16),ih,iw*16/9)',scale=1080:1920"
    ];
}

app.post('/prepare', async (req, res) => {
    let id;
    try {
        id = safeId(req.body.id);
    } catch (e) {
        return res.status(400).send('ID inválido');
    }

    const { url, inicio, fin, formato } = req.body; // formato: 'crop' | 'blur' (default 'crop')
    const raw = `/tmp/${id}_raw.mp4`;
    const cut = `/tmp/${id}_cut.mp4`;
    const cookiesOrigen = '/app/cookies.txt';
    const cookiesPath = `/tmp/${id}_cookies.txt`;

    try {
        if (!fs.existsSync(cookiesOrigen)) {
            console.error('¡ERROR CRÍTICO! No se encuentra cookies.txt en /app/');
            console.log('Contenido de /app:', fs.readdirSync('/app'));
            return res.status(500).send('Error: cookies.txt no encontrado');
        }
        fs.copyFileSync(cookiesOrigen, cookiesPath);

        console.log(`Descargando: ${url}`);
        await descargarConReintentos(url, raw, cookiesPath);

        console.log(`Recortando y convirtiendo a vertical (${formato || 'crop'})...`);

        const filtro = buildVerticalFilter(formato);

        // OJO: ya no usamos "-c copy" porque al aplicar filtros
        // hay que re-encodear el video (no se puede copiar el stream tal cual)
        await execFileAsync('ffmpeg', [
            '-y',
            '-i', raw,
            '-ss', String(inicio),
            '-to', String(fin),
            ...filtro,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            cut
        ], { timeout: 180000 });

        if (fs.existsSync(raw)) fs.unlinkSync(raw);
        if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);

        res.download(cut, 'video.mp4', (err) => {
            if (err) console.error('Error al enviar:', err);
            else if (fs.existsSync(cut)) fs.unlinkSync(cut);
        });

    } catch (e) {
        console.error('Error en /prepare:', e.message);
        res.status(500).send('Error: ' + e.message);
    }
});

app.post('/burn', async (req, res) => {
    let id;
    try {
        id = safeId(req.body.id);
    } catch (e) {
        return res.status(400).send('ID inválido');
    }

    const { srtContent } = req.body;
    const cut = `/tmp/${id}_cut.mp4`;
    const srt = `/tmp/${id}.srt`;
    const final = `/tmp/${id}_final.mp4`;

    try {
        fs.writeFileSync(srt, srtContent);
        await execFileAsync('ffmpeg', [
            '-y', '-i', cut,
            // FontSize más grande porque el video ahora es vertical (1080 de ancho)
            '-vf', `subtitles='${srt}':force_style='FontSize=36,Alignment=2,MarginV=80'`,
            '-c:v', 'libx264', '-preset', 'ultrafast', final
        ]);

        res.download(final, 'video_final.mp4', () => {
            [cut, srt, final].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
        });
    } catch (e) {
        res.status(500).send('Error: ' + e.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
