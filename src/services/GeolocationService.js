// src/services/GeolocationService.js
import { mapsProvider } from '../config/mapsConfig.js';
import { GoogleGeocodingAdapter } from '../adapters/GoogleGeocodingAdapter.js';
import { ORSGeocodingAdapter } from '../adapters/ORSGeocodingAdapter.js';

export class GeolocationService {
    static async geocodificarEnderecos(listaEnderecos) {
        // Escolhe o adaptador baseado no seu .env
        const adapter = mapsProvider === 'ors' 
            ? new ORSGeocodingAdapter() 
            : new GoogleGeocodingAdapter();

        const enderecosComCoordenadas = [];

        for (const endereco of listaEnderecos) {
            const coords = await adapter.lookup(endereco);
            if (coords) {
                enderecosComCoordenadas.push({ endereco, ...coords });
            } else {
                throw new Error(`Falha crítica: Endereço não encontrado: ${endereco}`);
            }
        }

        // Mantemos sua lógica de validação de RAIO_MAX_KM aqui embaixo...
        // (A lógica de Haversine que você já escreveu)
        
        return { enderecosComCoordenadas };
    }
}