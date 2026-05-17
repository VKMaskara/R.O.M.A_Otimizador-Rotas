import express from 'express';
import usuariosRoutes from './routes/usuarioRoutes.js';
import authRoutes from './routes/authRoutes.js';
const app = express();
app.use(express.json());


app.use('/usuarios', usuariosRoutes);

app.get('/', (req, res) => {
    res.send('Bem-vindo ao R.O.M.A.! agora rodando com Express.js');
});

app.use('/auth', authRoutes);

export default app;