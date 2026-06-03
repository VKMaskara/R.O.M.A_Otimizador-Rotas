import 'dotenv/config';
import cors from 'cors';
import app from './app.js';

const PORT = 3000;



// 2º: Inicializa o servidor para escutar as requisições
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});