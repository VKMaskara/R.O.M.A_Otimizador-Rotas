// src/services/GeolocationService.js
import { mapsProvider } from '../config/mapsConfig.js';
import { GoogleGeocodingAdapter } from '../adapters/GoogleGeocodingAdapter.js';
import { ORSGeocodingAdapter } from '../adapters/ORSGeocodingAdapter.js';

export class GeolocationService {

    /**
     * Geocodifica uma lista de paradas.
     *
     * Aceita dois formatos:
     *   - Array de strings (formato legado): ['Rua X, 1, SP', ...]
     *   - Array de objetos (novo formato):   [{ endereco, pacote, tipo }, ...]
     *
     * Retorna array de objetos com coordenadas + dados do pacote preservados:
     *   [{ endereco, lat, lng, pacote, tipo }, ...]
     */
    static async geocodificarEnderecos(listaParadas) {
        const adapter = mapsProvider === 'ors'
            ? new ORSGeocodingAdapter()
            : new GoogleGeocodingAdapter();

        const enderecosComCoordenadas = [];

        for (const parada of listaParadas) {
            // Suporte ao formato legado (string simples)
            const isString = typeof parada === 'string';
            const enderecoStr = isString ? parada : parada.endereco;

            const coords = await adapter.lookup(enderecoStr);

            if (!coords) {
                throw new Error(`Falha crítica: Endereço não encontrado: ${enderecoStr}`);
            }

            enderecosComCoordenadas.push({
                endereco: enderecoStr,
                lat: coords.lat,
                lng: coords.lng,
                // Preserva dados do pacote e tipo (null para strings legadas)
                pacote: isString ? null : (parada.pacote ?? null),
                tipo:   isString ? 'ENTREGA' : (parada.tipo ?? 'ENTREGA'),
            });
        }

        return { enderecosComCoordenadas };
    }
}