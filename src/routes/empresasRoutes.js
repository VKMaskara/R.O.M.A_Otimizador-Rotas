// src/routes/empresasRoutes.js
import { Router } from 'express';
import { EmpresaController } from '../controllers/empresaController.js';
import { autenticar, apenasEmpresa } from '../middlewares/autenticar.js';

const router = Router();

// POST — aberto, é o autocadastro
router.post('/', EmpresaController.criar);

// GET, PUT, DELETE — exigem login e tipo EMPRESA
router.get('/', autenticar, apenasEmpresa, EmpresaController.listar);
router.get('/:id', autenticar, apenasEmpresa, EmpresaController.buscarPorId);
router.put('/:id', autenticar, apenasEmpresa, EmpresaController.atualizar);
router.delete('/:id', autenticar, apenasEmpresa, EmpresaController.desativar);

export default router;