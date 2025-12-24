// main.js - O Orquestrador do Sistema
import { geocodificarEndereco} from './geolocalizacao.js';
import { calculateDistanceMatrix } from './matrix_coordenadas.js';
import { otimizarRota } from './tsp_otimizacao.js';

  async function iniciarSistema() {
    try {
        console.log("🚀 Iniciando processamento logístico...");

        // Passo 1: Geocodificação
         await geocodificarEndereco()
        // Passo 2: Matriz de Distâncias
        await calculateDistanceMatrix()
        // Passo 3: Otimização TSP
        await otimizarRota()
      

        console.log("🏁 Processo finalizado com sucesso!");
    } catch (error) {
        console.error("❌ Ocorreu um erro no fluxo principal:", error);
    }
}

iniciarSistema();