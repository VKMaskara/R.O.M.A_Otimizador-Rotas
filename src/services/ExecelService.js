import XLSX from 'xlsx';

/**
 * ExecelService — lê planilha Excel e retorna lista de paradas com
 * endereço completo + dados do pacote vinculado.
 *
 * Colunas esperadas na planilha:
 *   Endereco | Numero | Cidade | Estado | Tipo | Pacote | Destinatario | Observacao
 *
 * A coluna "Tipo" deve conter "DEPOSITO" para marcar a origem.
 * As colunas Pacote, Destinatario e Observacao são opcionais.
 */
export class ExecelService {

    static getAddresFromExel(filePath) {
        const workbook = XLSX.readFile(filePath, { codepage: 1252 });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Remove acentos apenas para comparação de campos como "Tipo"
        const limparTexto = (texto) => {
            if (!texto) return '';
            return String(texto)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\x00-\x7F]/g, '')
                .trim();
        };

        // Preserva acentos para endereços (geocoding precisa deles)
        const limparTextoLeve = (texto) => {
            if (!texto) return '';
            return String(texto)
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        let deposito = null;
        const entregas = [];

        data.forEach(linha => {
            if (!linha.Endereco) return;

            const endereco         = limparTextoLeve(linha.Endereco);
            const numero           = linha.Numero != null ? String(linha.Numero).trim() : 'SN';
            const cidade           = limparTextoLeve(linha.Cidade);
            const estado           = limparTextoLeve(linha.Estado);
            const enderecoCompleto = `${endereco}, ${numero}, ${cidade}, ${estado}, Brasil`;

            // Dados do pacote vinculado (opcionais)
            const pacote = {
                id:           limparTextoLeve(linha.Pacote)       || null,
                destinatario: limparTextoLeve(linha.Destinatario) || null,
                observacao:   limparTextoLeve(linha.Observacao)   || null,
            };

            const tipoLimpo = limparTexto(linha.Tipo).toUpperCase();

            if (tipoLimpo.includes('DEPOSITO')) {
                deposito = { endereco: enderecoCompleto, pacote: null, tipo: 'DEPOSITO' };
            } else {
                entregas.push({ endereco: enderecoCompleto, pacote, tipo: 'ENTREGA' });
            }
        });

        if (!deposito) {
            console.error("❌ ERRO: Nenhuma linha marcada como 'DEPOSITO' encontrada na planilha.");
            return null;
        }

        // Retorna array de paradas: depósito primeiro, depois as entregas
        return [deposito, ...entregas];
    }
}