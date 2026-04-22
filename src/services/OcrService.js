import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

/**
 * OcrService — extrai endereços e dados de pacotes a partir de
 * imagens (JPG, PNG) ou PDFs usando Tesseract OCR.
 *
 * Formato esperado no texto da imagem (um pacote por bloco):
 *
 *   PACOTE: PKG-001
 *   DESTINATÁRIO: João Silva
 *   ENDEREÇO: Rua Augusta, 2500
 *   BAIRRO: Jardim Paulista
 *   CIDADE: São Paulo
 *   ESTADO: SP
 *   OBS: Entregar na portaria
 *
 * Blocos são separados por uma linha em branco.
 * Campos sem "DEPOSITO" são tratados como entregas.
 * Para marcar o depósito/origem, use TIPO: DEPOSITO em um bloco.
 */
export class OcrService {

    /**
     * Processa um arquivo de imagem ou PDF e retorna lista de paradas
     * com endereço + pacote vinculado, no mesmo formato do ExecelService.
     *
     * @param {string} filePath - Caminho para o arquivo de imagem ou PDF
     * @returns {Promise<Array>} Lista de paradas [{endereco, pacote, tipo}]
     */
    static async extrairParadasDeImagem(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        console.log(`\n🔍 OCR: Iniciando leitura de "${path.basename(filePath)}"...`);

        const worker = await createWorker('por'); // Português

        try {
            const { data: { text } } = await worker.recognize(filePath);
            console.log(`✅ OCR: Texto extraído com sucesso.`);

            const paradas = OcrService._parsearTextoOCR(text);

            if (paradas.length === 0) {
                throw new Error('OCR não encontrou nenhuma parada válida na imagem. Verifique o formato do documento.');
            }

            return paradas;

        } finally {
            await worker.terminate();
        }
    }

    /**
     * Parseia o texto bruto do OCR e monta a lista de paradas.
     * Tolerante a variações de capitalização e espaçamento.
     *
     * @param {string} texto - Texto bruto retornado pelo Tesseract
     * @returns {Array} Lista de paradas
     */
    static _parsearTextoOCR(texto) {
        // Divide o texto em blocos separados por linhas em branco
        const blocos = texto
            .split(/\n{2,}/)
            .map(b => b.trim())
            .filter(b => b.length > 0);

        const paradas = [];
        let deposito = null;

        for (const bloco of blocos) {
            const campos = OcrService._extrairCamposDoBloco(bloco);

            // Ignora blocos sem endereço
            if (!campos.endereco && !campos.rua) continue;

            const rua    = campos.endereco || campos.rua || '';
            const numero = campos.numero   || 'SN';
            const bairro = campos.bairro   || '';
            const cidade = campos.cidade   || '';
            const estado = campos.estado   || '';

            // Monta endereço completo (mesmo formato do ExecelService)
            const enderecoCompleto = [rua, numero, bairro, cidade, estado, 'Brasil']
                .filter(p => p && p !== 'SN' || p === 'SN')
                .join(', ')
                .replace(/,\s*,/g, ',') // remove vírgulas duplas de campos vazios
                .trim();

            const pacote = {
                id:           campos.pacote        || null,
                destinatario: campos.destinatario  || campos.destinatário || null,
                observacao:   campos.obs           || campos.observacao   || null,
            };

            const tipo = (campos.tipo || '').toUpperCase();

            if (tipo.includes('DEPOSITO') || tipo.includes('DEPÓSITO')) {
                deposito = { endereco: enderecoCompleto, pacote: null, tipo: 'DEPOSITO' };
            } else {
                paradas.push({ endereco: enderecoCompleto, pacote, tipo: 'ENTREGA' });
            }
        }

        if (!deposito) {
            console.warn('⚠️  OCR: Nenhum depósito identificado. O primeiro endereço será usado como origem.');
            if (paradas.length > 0) {
                deposito = { ...paradas.shift(), tipo: 'DEPOSITO', pacote: null };
            } else {
                return [];
            }
        }

        return [deposito, ...paradas];
    }

    /**
     * Extrai campos chave:valor de um bloco de texto.
     * Ex: "PACOTE: PKG-001\nDESTINATÁRIO: João" → { pacote: 'PKG-001', destinatário: 'João' }
     *
     * @param {string} bloco
     * @returns {Object}
     */
    static _extrairCamposDoBloco(bloco) {
        const campos = {};
        const linhas = bloco.split('\n');

        for (const linha of linhas) {
            // Aceita separador ":" ou "-"
            const match = linha.match(/^([^:\-]+)[:\-]\s*(.+)$/);
            if (!match) continue;

            const chave = match[1]
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')   // remove acentos da chave
                .replace(/\s+/g, '_');

            const valor = match[2].trim();
            campos[chave] = valor;
        }

        return campos;
    }
}
