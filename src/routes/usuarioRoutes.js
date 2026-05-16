import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController.js';
import { validarUsuario } from '../middlewares/validarUsuario.js';

const router = Router();

// Rota para CRIAR usuário (A que você já tem)
router.post('/', validarUsuario, UsuarioController.criarUsuario);

// Rota para LISTAR usuários (Adicione esta quando criar a função no seu Controller)
router.get('/', UsuarioController.listarUsuarios); 

router.get('/:id', UsuarioController.buscarUsuarioPorId); 

router.put('/:id', UsuarioController.atualizar);

router.delete('/:id', UsuarioController.deletar);

export default router;