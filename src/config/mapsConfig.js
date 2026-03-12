import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from 'dotenv';
dotenv.config();

export const client = new Client({});
export const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Chave geral do Google
export const apiKeyMatriz = process.env.GOOGLE_MAPS_API_KEY; // Para manter compatibilidade

// Configurações do OpenRouteService
export const orsKey = process.env.ORS_API_KEY;

// Qual provedor usar? (Lido do .env)
export const mapsProvider = process.env.MAPS_PROVIDER || 'google';