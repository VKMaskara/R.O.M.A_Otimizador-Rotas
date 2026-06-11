// src/middlewares/autenticar.js
import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticação JWT.
 *
 * Espera o token no header:
 *   Authorization: Bearer <token>
 *
 * Após validar, injeta req.usuario = { id, tipo }
 */
export function autenticar(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // ── 1. Header ausente ────────────────────────────────────────────────────
    if (!authHeader) {
        return res.status(401).json({
            status: 'error',
            erro: 'Token não fornecido. Faça login para continuar.',
        });
    }

    // ── 2. Formato inválido (esperado "Bearer <token>") ──────────────────────
    const partes = authHeader.split(' ');
    if (partes.length !== 2 || partes[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({
            status: 'error',
            erro: 'Formato de token inválido. Use: Authorization: Bearer <token>',
        });
    }

    const token = partes[1];

    // ── 3. Verificar e decodificar o token ───────────────────────────────────
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = {
            id:   decoded.id,
            tipo: decoded.tipo,
        };
        next();
    } catch (err) {
        // Distingue token expirado de token inválido
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                erro: 'Token expirado. Faça login novamente.',
            });
        }
        return res.status(401).json({
            status: 'error',
            erro: 'Token inválido.',
        });
    }
}

/**
 * Middleware de autorização: apenas usuários do tipo EMPRESA.
 * Deve ser usado APÓS autenticar().
 */
export function apenasEmpresa(req, res, next) {
    if (req.usuario?.tipo !== 'EMPRESA') {
        return res.status(403).json({
            status: 'error',
            erro: 'Acesso restrito a empresas.',
        });
    }
    next();
}

/**
 * Middleware de autorização: apenas usuários do tipo ENTREGADOR.
 * Deve ser usado APÓS autenticar().
 */
export function apenasEntregador(req, res, next) {
    if (req.usuario?.tipo !== 'ENTREGADOR') {
        return res.status(403).json({
            status: 'error',
            erro: 'Acesso restrito a entregadores.',
        });
    }
    next();
}

/**
 * Middleware de autorização: apenas usuários do tipo ADMIN.
 * Deve ser usado APÓS autenticar().
 */
export function apenasAdmin(req, res, next) {
    if (req.usuario?.tipo !== 'ADMIN') {
        return res.status(403).json({
            status: 'error',
            erro: 'Acesso restrito a administradores.',
        });
    }
    next();
}