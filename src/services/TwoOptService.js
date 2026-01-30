// src/services/TwoOptService.js

export class TwoOptService {
    /**
     * Calcula a distância total de uma rota em Km.
     * @param {Array} rota - Array de índices (ex: [0, 3, 1, 2])
     * @param {Array} matrizKm - Matriz de distâncias em QUILÔMETROS (mesmo formato do TspService)
     */
    static calcularDistanciaTotal(rota, matrizKm) {
        if (!rota || !matrizKm || rota.length < 2) return 0;

        let distanciaTotalKm = 0;

        for (let i = 0; i < rota.length - 1; i++) {
            const origem = rota[i];
            const destino = rota[i + 1];

            const valorKm = matrizKm[origem] ? matrizKm[origem][destino] : undefined;

            // Penalidade alta (10.000 km) se valor inválido
            distanciaTotalKm += (valorKm === Infinity || valorKm === undefined)
                ? 10000
                : valorKm;
        }

        // Fechamento do ciclo: volta ao ponto inicial
        const ultimoPonto = rota[rota.length - 1];
        const primeiroPonto = rota[0];
        const trechoRetorno = matrizKm[ultimoPonto] ? matrizKm[ultimoPonto][primeiroPonto] : undefined;

        distanciaTotalKm += (trechoRetorno === Infinity || trechoRetorno === undefined)
            ? 10000
            : trechoRetorno;

        return distanciaTotalKm;
    }

    /**
     * Calcula a distância apenas da rota de entregas (sem o trecho de retorno ao depósito).
     * Útil para comparar com cálculos manuais que não incluem o retorno.
     */
    static calcularDistanciaSemRetorno(rota, matrizKm) {
        if (!rota || !matrizKm || rota.length < 2) return 0;
        let distanciaTotalKm = 0;
        for (let i = 0; i < rota.length - 1; i++) {
            const origem = rota[i];
            const destino = rota[i + 1];
            const valorKm = matrizKm[origem]?.[destino];
            distanciaTotalKm += (valorKm === Infinity || valorKm === undefined) ? 10000 : valorKm;
        }
        return distanciaTotalKm;
    }

    /**
     * Aplica o algoritmo 2-Opt para reduzir a quilometragem total.
     */
    static aplicar2Opt(rotaInicial, matrizKm) {
        let melhorRota = [...rotaInicial];
        let melhorDistancia = this.calcularDistanciaTotal(melhorRota, matrizKm);

        let tentativas = 0;
        let melhorou = true;

        while (tentativas < 1000 && melhorou) {
            tentativas++;
            melhorou = false;

            for (let i = 1; i < melhorRota.length - 2; i++) {
                for (let j = i + 1; j < melhorRota.length - 1; j++) {

                    const novaRota = this.inverterTrecho(melhorRota, i, j);
                    const novaDistancia = this.calcularDistanciaTotal(novaRota, matrizKm);

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