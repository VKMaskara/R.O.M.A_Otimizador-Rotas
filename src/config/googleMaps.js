import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({});

// Declaramos as constantes primeiro
const apiKey = process.env.GOOGLE_MAPS_GEOCOORDINATE_API_KEY; 
const apiKeyMatriz = process.env.GOOGLE_MAPS_MATRIX_API_KEY;

// Log de diagnóstico para o terminal
console.log("------------------------------------------");
console.log("🔑 Verificando chaves no carregamento:");
console.log("Geocode:", apiKey ? "OK ✅" : "VAZIA ❌");
console.log("Matriz:", apiKeyMatriz ? "OK ✅" : "VAZIA ❌");
console.log("------------------------------------------");

// Exportação única para evitar o erro "Duplicate export"
export { client, apiKey, apiKeyMatriz };