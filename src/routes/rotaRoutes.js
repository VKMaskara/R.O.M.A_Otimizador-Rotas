// src/routes/rotaRoutes.js
import { Router } from 'express';
import { RotaController } from '../controllers/rotaController.js';
import { autenticar, apenasEmpresa, apenasEntregador } from '../middlewares/autenticar.js';
import { uploadPlanilha } from '../middlewares/uploadMiddleware.js';

const router = Router();

// ─── ROTAS DA EMPRESA ─────────────────────────────────────────────────────────

// POST /rotas/otimizar — empresa envia endereços (JSON) e recebe rota otimizada
router.post('/otimizar', autenticar, apenasEmpresa, RotaController.otimizar);

// POST /rotas/otimizar-excel — empresa envia planilha (multipart/form-data)
router.post(
    '/otimizar-excel',
    autenticar,
    apenasEmpresa,
    uploadPlanilha.single('planilha'),
    RotaController.otimizarExcel
);

// GET /rotas — empresa lista todas as suas rotas
router.get('/', autenticar, apenasEmpresa, RotaController.listar);

// GET /rotas/:id — empresa vê detalhe de uma rota com paradas e resultado
router.get('/:id', autenticar, apenasEmpresa, RotaController.detalhar);

// PATCH /rotas/:id/entregador — empresa atribui entregador à rota
router.patch('/:id/entregador', autenticar, apenasEmpresa, RotaController.atribuirEntregador);

// POST /rotas/:id/resultado — entregador finaliza e registra o resultado
router.post('/:id/resultado', autenticar, apenasEntregador, RotaController.registrarResultado);

export default router;