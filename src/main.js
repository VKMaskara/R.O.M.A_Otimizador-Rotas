import { OtimizacaoController } from "./controllers/OtimizacaoController.js";

async function main() {
    try {
        console.log("🚀 Iniciando o processo principal...");
        await OtimizacaoController.iniciarOtimizacao();
    } catch (error) {
        console.error("❌ Erro no processo principal:", error.message);
    }
}
main();