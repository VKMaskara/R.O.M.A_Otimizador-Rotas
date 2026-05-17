import 'dotenv/config';
import app from './app.js';

const PORT = 3000;
//console.log(process.env.JWT_SECRET);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});
