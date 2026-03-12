import axios from 'axios';
import { orsKey } from '../config/mapsConfig.js';

export class ORSGeocodingAdapter {
    /**
     * Converte endereço em coordenadas usando a API gratuita do ORS (Pelias).
     * @param {string} endereco 
     * @returns {Promise<{lat: number, lng: number} | null>}
     */
    async lookup(endereco) {
        try {
            const response = await axios.get('https://api.openrouteservice.org/geocode/search', {
                params: {
                    api_key: orsKey,
                    text: endereco,
                    'boundary.country': 'BR', // Restringe a busca ao Brasil
                    size: 1 // Queremos apenas o melhor resultado
                }
            });

            // O ORS retorna GeoJSON, então os dados ficam em 'features'
            if (!response.data.features || response.data.features.length === 0) {
                console.warn(`⚠️ ORS: Nenhum resultado para "${endereco}"`);
                return null;
            }

            // ATENÇÃO: O GeoJSON usa o padrão [longitude, latitude]
            const [lng, lat] = response.data.features[0].geometry.coordinates;

            return { lat, lng };
        } catch (error) {
            const msg = error.response?.data?.error?.message || error.message;
            console.error(`❌ Erro no ORS Geocoding: ${msg}`);
            return null;
        }
    }
}