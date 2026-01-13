// main.js - O Orquestrador do Sistema
import { geocodificarEndereco } from './geolocalizacao.js';
import { calculateDistanceMatrix } from './matrix_coordenadas.js';
import { optimizeRoute } from './tsp_otimizacao.js';
import { aplicar2Opt } from './otimizacao_2opt.js';
import { totalKm } from './otimizacao_2opt.js';
import fs from 'fs';

async function iniciarSistema() {
    try {
        console.log("🚀 Iniciando processamento logístico...");

        // Passo 1: Geocodificação
        await geocodificarEndereco()
        // Passo 2: Matriz de Distâncias
        await calculateDistanceMatrix()
        // Passo 3: Otimização TSP
        const rotaInicial = await optimizeRoute()
        // Passo 4: Otimização 2-Opt
        const matrizRef = JSON.parse(fs.readFileSync('./output/distancia_matriz_bruta.json', 'utf8'));


        const rotaFinalRefinada = aplicar2Opt(rotaInicial, matrizRef.distancias_e_tempos);

        console.log("🏁 Processo finalizado com sucesso!");
        console.log("Rota final refinada:", rotaFinalRefinada);

        // No final do main.js:
        const kmInicial = totalKm(rotaInicial, matrizRef.distancias_e_tempos);
        const kmFinal = totalKm(rotaFinalRefinada, matrizRef.distancias_e_tempos);

        console.log(`📏 Distância TSP Bruto: ${kmInicial.toFixed(2)} Km`);
        console.log(`✨ Distância Refinada (2-Opt): ${kmFinal.toFixed(2)} Km`);
        console.log(`🎉 Economia de: ${(kmInicial - kmFinal).toFixed(2)} Km`);

    } catch (error) {
        console.error("❌ Ocorreu um erro no fluxo principal:", error);
    }
}

iniciarSistema();
