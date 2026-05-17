import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { UsuarioModel } from '../models/usuarioModel.js';

export class AuthService {
    
    static async login(email, senha) {
        
        // 1. Buscar o usuário pelo email
        const usuario =  await UsuarioModel.buscarComSenhaPorEmail(email);

        // 2. Verificar se o usuário existe
        if (!usuario){
            throw new Error('Usuário ou senha inválidos');
        }

        // 3. Compara senha 
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)

        // 4. Se a senha for inválida, retorna erro
        if (!senhaValida) {
            throw new Error('Usuário ou senha inválidos');
        }

        // 5. Gerar token JWT
        const token = jwt.sign(
            {
                id : usuario.id,
                tipo: usuario.tipo
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d' 
            }
        )

        // 6. Retornar o token e os dados do usuário (sem a senha)
        return {
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            },
            token
        }
    }
}