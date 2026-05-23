import express from 'express';
import 'dotenv/config';
import usuariosRoutes from './routes/usuarioRoutes.js';
import authRoutes from './routes/authRoutes.js';
import empresaRoute from './routes/empresasRoutes.js'
import entregadoresRoute from './routes/entregadorRoutes.js'
import rotaRoutes  from './routes/rotaRoutes.js';
import paradaRoutes from './routes/paradaRoutes.js';
const app = express();
app.use(express.json());


app.use('/usuarios', usuariosRoutes);

app.use('/empresas', empresaRoute)

app.use('/entregadores', entregadoresRoute )

app.use('/rotas',   rotaRoutes);

app.use('/paradas', paradaRoutes);

app.get('/', (req, res) => {
    res.send('Bem-vindo ao R.O.M.A.! agora rodando com Express.js');
});

app.use('/auth', authRoutes);

export default app;