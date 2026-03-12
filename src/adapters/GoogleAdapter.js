// src/adapters/GoogleAdapter.js
import { client, apiKeyMatriz } from '../config/mapsConfig.js';

export class GoogleAdapter {
    constructor() {
        this.BATCH_SIZE = 1; // Mantemos a regra que você já definiu
    }

    async getMatrix(listaCoordenadas) {
        const combinedMatrix = [];
        const numPoints = listaCoordenadas.length;

        for (let i = 0; i < numPoints; i += this.BATCH_SIZE) {
            const originsBatch = listaCoordenadas.slice(i, i + this.BATCH_SIZE);
            
            // O trecho que você identificou vem para cá!
            const response = await client.distancematrix({
                params: {
                    origins: originsBatch,
                    destinations: listaCoordenadas,
                    key: apiKeyMatriz,
                    mode: 'driving',
                },
                timeout: 10000
            });

            if (response.data.status !== "OK") {
                throw new Error(response.data.error_message || response.data.status);
            }

            combinedMatrix.push(...response.data.rows);
        }

        return combinedMatrix; // Retorna o formato que o seu TspService já ama
    }
}