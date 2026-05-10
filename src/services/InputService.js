import path from 'path';
import { ExecelService } from './ExecelService.js';
import { OcrService } from './OcrService.js';
import { ManualInputService } from './ManualInputService.js';

/**
 * InputService — ponto único de entrada de dados do R.O.M.A.
 *
 * Suporta 3 modos, configuráveis via variável de ambiente INPUT_MODE
 * ou passando o modo diretamente:
 *
 *   excel  → lê data/input_enderecos.xlsx (padrão)
 *   ocr    → lê arquivo de imagem/PDF passado em INPUT_FILE
 *   manual → coleta pelo terminal de forma interativa
 *
 * Em todos os casos, retorna um array padronizado:
 *   [
 *     { endereco: string, pacote: null,   tipo: 'DEPOSITO' },
 *     { endereco: string, pacote: Pacote, tipo: 'ENTREGA'  },
 *     ...
 *   ]
 *
 * Onde Pacote = { id, destinatario, observacao }
 */
export class InputService {

    /**
     * Carrega as paradas de acordo com o modo configurado.
     *
     * @param {string} [modo] - 'excel' | 'ocr' | 'manual'
     *                          Se omitido, usa process.env.INPUT_MODE ou 'excel'.
     * @returns {Promise<Array>} Lista de paradas padronizada
     */
    static async carregarParadas(modo) {
        const modoFinal = (modo || process.env.INPUT_MODE || 'excel').toLowerCase();

        console.log(`\n📥 InputService: modo "${modoFinal}" selecionado.`);

        let paradas = null;

        switch (modoFinal) {

            case 'excel': {
                const filePath = path.resolve(
                    process.env.INPUT_FILE || path.join('data', 'input_enderecos.xlsx')
                );
                console.log(`   Arquivo: ${filePath}`);
                paradas = ExecelService.getAddresFromExel(filePath);
                if (!paradas) throw new Error('Falha ao ler o arquivo Excel.');
                InputService._logResumo(paradas);
                break;
            }

            case 'ocr': {
                const filePath = path.resolve(
                    process.env.INPUT_FILE || path.join('data', 'input_imagem.png')
                );
                console.log(`   Arquivo: ${filePath}`);
                paradas = await OcrService.extrairParadasDeImagem(filePath);
                InputService._logResumo(paradas);
                break;
            }

            case 'manual': {
                paradas = await ManualInputService.coletarParadasInterativamente();
                InputService._logResumo(paradas);
                break;
            }

            default:
                throw new Error(
                    `Modo de input inválido: "${modoFinal}". Use "excel", "ocr" ou "manual".`
                );
        }


        /*
        .find() → para quando existe um único resultado esperado
        .filter() → para quando podem existir vários
        */
        const deposito = paradas.find(p => p.tipo === 'DEPOSITO'); // Deve haver exatamente um depósito
        const entregas = paradas.filter(p => p.tipo === 'ENTREGA'); // deve haver pelomenos uma entrega

        if (!deposito) {
            throw new Error('O depósito é obrigatório. Verifique o arquivo de input.');
        }
        if (entregas.length === 0) {
            throw new Error('Pelo menos uma entrega é obrigatória. Verifique o arquivo de input.');
        }

        return paradas; // Só chega aqui se passa nas verificações acima
    }

    /**
     * Extrai apenas os endereços (strings) de uma lista de paradas.
     * Mantém compatibilidade com GeolocationService e MatrizService.
     *
     * @param {Array} paradas
     * @returns {string[]}
     */
    static extrairEnderecos(paradas) {
        return paradas.map(p => p.endereco);
    }

    /**
     * Exibe um resumo das paradas carregadas no console.
     * @private
     */
    static _logResumo(paradas) {
        const entregas = paradas.filter(p => p.tipo === 'ENTREGA');
        const deposito = paradas.find(p => p.tipo === 'DEPOSITO');
        const comPacote = entregas.filter(e => e.pacote?.id).length;

        console.log(`\n📋 Resumo do input:`);
        console.log(`   Depósito  : ${deposito?.endereco ?? '—'}`);
        console.log(`   Entregas  : ${entregas.length}`);
        console.log(`   Com pacote: ${comPacote} de ${entregas.length}`);
    }
}
