// src/services/GeolocationService.js
import { client, apiKey } from '../config/googleMaps.js';

/** Bounding box aproximado do estado de SP (evita resultados em outros estados). */
const COMPONENTES_SP = 'administrative_area:SP|country:BR';

/**
 * Converte uma lista de endereços (strings) em coordenadas lat/lng
 * usando a API de Geocoding do Google Maps.
 * Restringe resultados ao estado de SP para evitar matches errados (ex: outra "Praça da Sé").
 */
export class GeolocationService {
    /**
     * Geocodifica um único endereço, restringindo ao estado de SP.
     * @param {string} endereco - Endereço completo (ex: "Rua X, 123, Cidade, Estado, Brasil")
     * @param {object} opts - { components } opcional para override (ex: outro estado)
     * @returns {Promise<{ endereco: string, lat: number, lng: number } | null>}
     */
    static async geocodificarEndereco(endereco, opts = {}) {
        if (!endereco || !apiKey) {
            throw new Error("Endereço ou chave da API de Geocoding não fornecidos.");
        }
        const components = opts.components ?? COMPONENTES_SP;
        try {
            const response = await client.geocode({
                params: {
                    address: endereco,
                    key: apiKey,
                    components: components,
                    region: 'br',
                },
                timeout: 10000,
            });

            if (response.data.status !== "OK" || !response.data.results?.length) {
                console.warn(`⚠️ Nenhum resultado de geocoding para: ${endereco}`);
                return null;
            }

            const { geometry } = response.data.results[0];
            const lat = geometry.location.lat;
            const lng = geometry.location.lng;

            return { endereco, lat, lng };
        } catch (error) {
            const msg = error.response?.data?.error_message || error.message;
            throw new Error(`Erro ao geocodificar "${endereco}": ${msg}`);
        }
    }

    /**
     * Calcula distância aproximada em km entre dois pontos (Haversine).
     */
    static _distanciaKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Geocodifica uma lista de endereços e retorna coordenadas para a matriz.
     * @param {string[]} listaEnderecos - Array de endereços (ex: saída do ExecelService)
     * @returns {Promise<{ enderecosComCoordenadas: Array<{endereco, lat, lng}>, coordenadasParaMatriz: string[] }>}
     */
    static async geocodificarEnderecos(listaEnderecos) {
        if (!listaEnderecos || listaEnderecos.length === 0) {
            throw new Error("Lista de endereços vazia para geolocalização.");
        }

        console.log(`\n📍 Iniciando geolocalização de ${listaEnderecos.length} endereços...`);

        const enderecosComCoordenadas = [];
        const coordenadasParaMatriz = [];

        for (let i = 0; i < listaEnderecos.length; i++) {
            const endereco = listaEnderecos[i];
            console.log(`   [${i + 1}/${listaEnderecos.length}] ${endereco}`);
            const resultado = await this.geocodificarEndereco(endereco);
            if (resultado) {
                enderecosComCoordenadas.push(resultado);
                coordenadasParaMatriz.push(`${resultado.lat},${resultado.lng}`);
            } else {
                throw new Error(`Não foi possível geocodificar o endereço: ${endereco}`);
            }
        }

        // Validação: avisar se algum ponto ficou muito longe dos outros (possível geocoding errado)
        if (enderecosComCoordenadas.length >= 2) {
            const latMed = enderecosComCoordenadas.reduce((s, p) => s + p.lat, 0) / enderecosComCoordenadas.length;
            const lngMed = enderecosComCoordenadas.reduce((s, p) => s + p.lng, 0) / enderecosComCoordenadas.length;
            const RAIO_MAX_KM = 150;
            for (const p of enderecosComCoordenadas) {
                const d = this._distanciaKm(p.lat, p.lng, latMed, lngMed);
                if (d > RAIO_MAX_KM) {
                    console.warn(`   ⚠️ Ponto muito longe do resto (${d.toFixed(0)} km do centro): ${p.endereco} → (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`);
                }
            }
        }

        console.log("✅ Geolocalização concluída com sucesso.\n");
        return {
            enderecosComCoordenadas,
            coordenadasParaMatriz,
        };
    }
}
