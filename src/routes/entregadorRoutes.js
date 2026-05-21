import { Router } from "express"; 
import {EntregadorController} from '../controllers/entregadorController'

const router = Router()

// POST /empresas — cadastrar nova empresa (autocadastro ou admin)
router.post('/', EntregadorController.criar);
 
// GET /empresas — listar todas as empresas
router.get('/', EntregadorController.listar);
 
// GET /empresas/:id — buscar empresa por id
router.get('/:id', EntregadorController.buscarPorId);
 
// PUT /empresas/:id — atualizar dados da empresa
router.put('/:id', EntregadorController.atualizar);
 
// DELETE /empresas/:id — desativar empresa (soft delete)
router.delete('/:id', EntregadorController.desativar);
 
export default router;