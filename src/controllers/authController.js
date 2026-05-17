import { AuthService } from "../services/AuthService.js";

export class AuthController {

    static async login(req, res) {
        try {
            const { email, senha } = req.body;
            const resultado = await AuthService.login(
                email,
                senha
            );

            return res.status(200).json({
                status: 'success',
                dados: resultado
            });

        } catch (error) {
            return res.status(401).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }
}