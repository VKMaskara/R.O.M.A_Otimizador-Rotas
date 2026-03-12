import { GoogleAdapter } from '../adapters/GoogleAdapter.js';
import { ORSAdapter } from '../adapters/ORSAdapter.js';
import { mapsProvider } from '../config/mapsConfig.js';

export class MatrizService {
    static async gerarMatrizCompleta(listaCoordenadas) {
        console.log(`\n⏳ ROMA: Solicitando matriz via [${mapsProvider.toUpperCase()}]...`);

        let adapter;

        if (mapsProvider === 'ors') {
            adapter = new ORSAdapter();
        } else {
            adapter = new GoogleAdapter();
        }

        const combinedMatrix = await adapter.getDistanceMatrix(listaCoordenadas);
        
        return combinedMatrix;
    }
}