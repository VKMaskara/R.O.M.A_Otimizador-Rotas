import XLSX from 'xlsx';

export class ExecelService {
    static getAddresFromExel(filePath) {
        // 1. Lê o arquivo
        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 4. Converte para JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        let enderecoDeposito = null;
        const enderecosEntregas = [];

        data.forEach(linha => {
            // Ignora a linha 2 (vazia) da sua planilha
            if (!linha.Endereco) return;

            // Função interna para limpar o texto de forma agressiva contra erros de encoding
            const limparTexto = (texto) => {
                if (!texto) return "";
                return String(texto)
                    .normalize('NFD') // Decompõe acentos
                    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
                    .replace(/[^\x00-\x7F]/g, "") // Remove QUALQUER caractere não-ASCII (o \x93 estranho)
                    .trim();
            };

            const endereco = limparTexto(linha.Endereco);
            const numero = linha.Numero || 'SN';
            const cidade = limparTexto(linha.Cidade);
            const estado = limparTexto(linha.Estado);

            // Monta o endereço final limpo
            const enderecoLimpo = `${endereco}, ${numero}, ${cidade}, ${estado}, Brasil`;

            // 6. Identificação da Origem (Usando a limpeza também no campo Tipo)
            const tipoLimpo = limparTexto(linha.Tipo).toUpperCase();
            
            if (tipoLimpo.includes("DEPOSITO")) {
                enderecoDeposito = enderecoLimpo;
            } else {
                enderecosEntregas.push(enderecoLimpo);
            }
        });

        // 7. Validação Final para o Controller
        if (!enderecoDeposito) {
            console.error("❌ ERRO: O marcador 'DEPOSITO' não foi reconhecido devido ao encoding.");
            return null;
        }

        return [enderecoDeposito, ...enderecosEntregas];
    }
}