const express = require('express');
const app = express();
app.use(express.json());

// Ruta de prueba para verificar que el servidor vive
app.get('/', (req, res) => {
    res.send('OK');
});

// Ruta para recibir los parámetros de n8n
app.post('/cut', (req, res) => {
    console.log('Parámetros recibidos:', req.body);
    res.status(200).send('Parameters received successfully');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
