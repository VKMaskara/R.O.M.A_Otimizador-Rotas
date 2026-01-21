// src/services/TwoOptService.js

export class TwoOptService {
    /**
     * Calcula a distância total de uma rota em Km.
     * @param {Array} rota - Array de índices (ex: [0, 3, 1, 2])
     * @param {Array} matrizLimpa - Matriz contendo valores em METROS
     */
    static calcularDistanciaTotal(rota, matrizLimpa) {
        if (!rota || !matrizLimpa || rota.length < 2) return 0;

        let distanciaTotalMetros = 0;

        for (let i = 0; i < rota.length - 1; i++) {
            const origem = rota[i];
            const destino = rota[i + 1];

            // Proteção contra índices fora do limite da matriz
            const valorMetros = matrizLimpa[origem] ? matrizLimpa[origem][destino] : undefined;

            // Segurança: Se o valor for inválido, aplica penalidade alta (10km)
            distanciaTotalMetros += (valorMetros === Infinity || valorMetros === undefined)
                ? 10000
                : valorMetros;
        }

        // --- FECHAMENTO DO CICLO: Volta ao ponto inicial ---
        const ultimoPonto = rota[rota.length - 1];
        const primeiroPonto = rota[0];
        const trechoRetorno = matrizLimpa[ultimoPonto] ? matrizLimpa[ultimoPonto][primeiroPonto] : undefined;

        distanciaTotalMetros += (trechoRetorno === Infinity || trechoRetorno === undefined)
            ? 10000
            : trechoRetorno;

        // Metros para Quilômetros é divisão por 1000
        return distanciaTotalMetros / 1000;
    }

    /**
     * Aplica o algoritmo 2-Opt para reduzir a quilometragem total.
     */
    static aplicar2Opt(rotaInicial, matrizLimpa) {
        let melhorRota = [...rotaInicial];
        let melhorDistancia = this.calcularDistanciaTotal(melhorRota, matrizLimpa);

        let tentativas = 0;
        let melhorou = true;

        while (tentativas < 1000 && melhorou) {
            tentativas++;
            melhorou = false;

            for (let i = 1; i < melhorRota.length - 2; i++) {
                for (let j = i + 1; j < melhorRota.length - 1; j++) {

                    const novaRota = this.inverterTrecho(melhorRota, i, j);
                    const novaDistancia = this.calcularDistanciaTotal(novaRota, matrizLimpa);

                    if (novaDistancia < melhorDistancia) {
                        melhorDistancia = novaDistancia;
                        melhorRota = novaRota;
                        melhorou = true;
                    }
                }
            }
        }

        return {
            rotaOtimizada: melhorRota,
            distanciaFinal: melhorDistancia
        };
    }

    /**
     * Função auxiliar para inverter um segmento da rota
     */
    static inverterTrecho(rota, i, j) {
        const novaRota = rota.slice(0, i);
        const trechoInvertido = rota.slice(i, j + 1).reverse();

        novaRota.push(...trechoInvertido);
        novaRota.push(...rota.slice(j + 1));

        return novaRota;
    }
}