// src/routes/entregadorRoutes.js
import { Router } from 'express';
import { EntregadorController } from '../controllers/entregadorController.js';
import { autenticar, apenasEmpresa, apenasEntregador } from '../middlewares/autenticar.js';

const router = Router();

// ─── ROTAS DA EMPRESA (gestão de entregadores) ────────────────────────────────

// POST /entregadores — cadastrar novo entregador
router.post('/', autenticar, apenasEmpresa, EntregadorController.criar);

// GET /entregadores — listar entregadores da empresa
router.get('/', autenticar, apenasEmpresa, EntregadorController.listar);

// GET /entregadores/minha-rota — entregador vê a rota atribuída para hoje
router.get('/minha-rota', autenticar, apenasEntregador, EntregadorController.minhaRota);

// GET /entregadores/:id — buscar entregador por id
router.get('/:id', autenticar, apenasEmpresa, EntregadorController.buscarPorId);

// PUT /entregadores/:id — atualizar entregador
router.put('/:id', autenticar, apenasEmpresa, EntregadorController.atualizar);

// DELETE /entregadores/:id — desativar entregador (soft delete)
router.delete('/:id', autenticar, apenasEmpresa, EntregadorController.desativar);




export default router;