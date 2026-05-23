// src/services/GeolocationService.js
import { mapsProvider } from '../config/mapsConfig.js';
import { GoogleGeocodingAdapter } from '../adapters/GoogleGeocodingAdapter.js';
import { ORSGeocodingAdapter } from '../adapters/ORSGeocodingAdapter.js';

export class GeolocationService {

    /**
     * Geocodifica uma lista de paradas.
     *
     * Aceita dois formatos:
     * - Array de strings (formato legado): ['Rua X, 1, SP', ...]
     * - Array de objetos (novo formato):   [{ endereco, pacote, tipo }, ...]
     *
     * Retorna array de objetos com coordenadas + dados do pacote preservados:
     * [{ endereco, lat, lng, pacote, tipo }, ...]
     */
    static async geocodificarEnderecos(listaParadas) {
        const adapter = mapsProvider === 'ors'
            ? new ORSGeocodingAdapter()
            : new GoogleGeocodingAdapter();

        const enderecosOk = [];
        const enderecosComErro = [];

        for (const [index, parada] of listaParadas.entries()) {
            // Suporte ao formato legado (string simples)
            const isString = typeof parada === 'string';
            const enderecoStr = isString ? parada : parada.endereco; //parada é string → usa direto como endereço
            //parada é objeto → extrai só o campo .endereco

            try {
                const coords = await adapter.lookup(enderecoStr);

                if (!coords) {
                    throw new Error(`Falha crítica: Endereço não encontrado: ${enderecoStr}`);
                }

                // ✅ Endereço ok — vai para a fila de roteirização
                enderecosOk.push({
                    endereco: enderecoStr,
                    lat: coords.lat,
                    lng: coords.lng,
                    pacote: isString ? null : (parada.pacote ?? null),
                    tipo: isString ? 'ENTREGA' : (parada.tipo ?? 'ENTREGA'),
                });

            } catch (error) {
                // Exibe o motivo real da falha no terminal para facilitar o debug
                console.error(`❌ Erro ao geocodificar o endereço "${enderecoStr}":`, error.message);

                // ❌ Endereço falhou — registra para a API informar a empresa
                enderecosComErro.push({
                    posicao: index + 1,
                    endereco: enderecoStr,
                    erro: error.message,
                });
            }
        }
        return {
            status: enderecosComErro.length > 0 ? 'parcial' : 'success',
            enderecosOk,       // prontos para roteirizar
            enderecosComErro,  // a empresa decide: corrigir ou pular
        };
    }
}