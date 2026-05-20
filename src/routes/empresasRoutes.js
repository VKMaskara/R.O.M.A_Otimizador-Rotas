// src/routes/empresaRoutes.js
import { Router } from 'express';
import { EmpresaController } from '../controllers/empresaController.js';

const router = Router();

// POST /empresas — cadastrar nova empresa (autocadastro ou admin)
router.post('/', EmpresaController.criar);

// GET /empresas — listar todas as empresas
router.get('/', EmpresaController.listar);

// GET /empresas/:id — buscar empresa por id
router.get('/:id', EmpresaController.buscarPorId);

// PUT /empresas/:id — atualizar dados da empresa
router.put('/:id', EmpresaController.atualizar);

// DELETE /empresas/:id — desativar empresa (soft delete)
router.delete('/:id', EmpresaController.desativar);

export default router;0