// src/routes/paradaRoutes.js
import { Router } from 'express';
import { RotaController } from '../controllers/rotaController.js';
import { autenticar, apenasEntregador } from '../middlewares/autenticar.js';

const router = Router();

// PATCH /paradas/:id/status — entregador marca parada como entregue ou falhou
router.patch('/:id/status', autenticar, apenasEntregador, RotaController.atualizarStatusParada);

export default router;