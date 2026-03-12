import axios from 'axios';
import { orsKey } from '../config/mapsConfig.js'; // Usando o config que planejamos

export class ORSAdapter {
    /**
     * @param {Array} listaCoordenadas - O ORS prefere [[lon, lat], [lon, lat]]
     */
    async getDistanceMatrix(listaCoordenadas) {
        try {
            // O ORS espera Longitude primeiro, depois Latitude [lon, lat]
            // Vamos supor que sua lista venha como [{lat, lng}, ...] ou "lat,lng"
            // Aqui fazemos a conversão necessária
            const locations = listaCoordenadas.map(coord => {
                if (typeof coord === 'string') {
                    const [lat, lng] = coord.split(',').map(Number);
                    return [lng, lat]; 
                }
                return [coord.lng, coord.lat];
            });

            const response = await axios.post(
                'https://api.openrouteservice.org/v2/matrix/driving-car',
                {
                    locations: locations,
                    metrics: ['duration', 'distance'],
                    units: 'm'
                },
                {
                    headers: {
                        'Authorization': orsKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Agora a "Mágica": Traduzir o formato ORS para o formato "Google/ROMA"
            // O ORS retorna matrizes simples: response.data.durations[i][j]
            return response.data.durations.map((row, i) => ({
                elements: row.map((duration, j) => ({
                    duration: { value: duration },
                    distance: { value: response.data.distances[i][j] || 0 },
                    status: "OK"
                }))
            }));

        } catch (error) {
            console.error("❌ Erro no ORS Adapter:", error.response?.data || error.message);
            throw new Error("Falha ao calcular matriz via OpenRouteService.");
        }
    }
}