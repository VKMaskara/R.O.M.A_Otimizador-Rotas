// src/middlewares/autenticar.js
import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticação JWT.
 *
 * Verifica se o token é válido e injeta os dados do usuário em req.usuario.
 * Uso: router.post('/rota', autenticar, Controller.metodo)
 *
 * Para rotas exclusivas de empresa:  autenticar, apenasEmpresa
 * Para rotas exclusivas de entregador: autenticar, apenasEntregador
 */
export function autenticar(req, res, next) {
    const authHeader = req.headers['authorization'];

    // Espera o formato: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            mensagem: 'Token não fornecido. Faça login para continuar.'
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Injeta os dados do usuário na requisição
        // Disponível em qualquer controller como req.usuario
        req.usuario = {
            id:   payload.id,
            tipo: payload.tipo
        };

        next(); // segue para o controller

    } catch (error) {
        return res.status(401).json({
            status: 'error',
            mensagem: 'Token inválido ou expirado. Faça login novamente.'
        });
    }
}

/**
 * Middleware de autorização — só empresas passam.
 * Sempre usar depois do autenticar.
 */
export function apenasEmpresa(req, res, next) {
    if (req.usuario.tipo !== 'EMPRESA') {
        return res.status(403).json({
            status: 'error',
            mensagem: 'Acesso restrito a empresas.'
        });
    }
    next();
}

/**
 * Middleware de autorização — só entregadores passam.
 * Sempre usar depois do autenticar.
 */
export function apenasEntregador(req, res, next) {
    if (req.usuario.tipo !== 'ENTREGADOR') {
        return res.status(403).json({
            status: 'error',
            mensagem: 'Acesso restrito a entregadores.'
        });
    }
    next();
}