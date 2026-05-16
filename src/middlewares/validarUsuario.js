export function validarUsuario(req, res, next) {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            status: 'error',
            mensagem: 'Todos os campos são obrigatórios'
        });
    }

    next();
}