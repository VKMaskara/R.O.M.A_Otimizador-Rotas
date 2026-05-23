import express from 'express';
import 'dotenv/config';
import usuariosRoutes    from './routes/usuarioRoutes.js';
import authRoutes        from './routes/authRoutes.js';
import empresaRoute      from './routes/empresasRoutes.js';
import entregadoresRoute from './routes/entregadorRoutes.js';
import rotaRoutes        from './routes/rotaRoutes.js';
import paradaRoutes      from './routes/paradaRoutes.js';

const app = express();
app.use(express.json());

// ─── Rotas públicas ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.send('Bem-vindo ao R.O.M.A! Rodando com Express.js');
});
app.use('/auth',        authRoutes);

// ─── Rotas protegidas ─────────────────────────────────────────────────────────
app.use('/usuarios',    usuariosRoutes);
app.use('/empresas',    empresaRoute);
app.use('/entregadores', entregadoresRoute);
app.use('/rotas',       rotaRoutes);
app.use('/paradas',     paradaRoutes);

export default app;