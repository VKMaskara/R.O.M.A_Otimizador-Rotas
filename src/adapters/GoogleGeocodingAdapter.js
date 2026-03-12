// src/adapters/GoogleGeocodingAdapter.js
import { client, apiKey } from '../config/mapsConfig.js';

export class GoogleGeocodingAdapter {
    async lookup(endereco) {
        const response = await client.geocode({
            params: {
                address: endereco,
                key: apiKey,
                components: 'administrative_area:SP|country:BR',
                region: 'br',
            },
            timeout: 10000,
        });

        if (response.data.status !== "OK" || !response.data.results?.length) {
            return null;
        }

        const { geometry } = response.data.results[0];
        return {
            lat: geometry.location.lat,
            lng: geometry.location.lng
        };
    }
}