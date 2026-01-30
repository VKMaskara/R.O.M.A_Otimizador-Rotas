import XLSX from 'xlsx';

export class ExecelService {
    static getAddresFromExel(filePath) {
        // 1. Lê o arquivo (codepage 1252 ajuda com acentos em arquivos salvos no Windows)
        const workbook = XLSX.readFile(filePath, { codepage: 1252 });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 4. Converte para JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        let enderecoDeposito = null;
        const enderecosEntregas = [];

        data.forEach(linha => {
            // Ignora a linha 2 (vazia) da sua planilha
            if (!linha.Endereco) return;

            // Limpeza leve: remove apenas caracteres de controle e quebrados; preserva acentos (ç, é, ã, etc.)
            // para que o Geocoding encontre o lugar certo (ex: "Praça da Sé" em SP, não outra cidade).
            const limparTextoLeve = (texto) => {
                if (!texto) return "";
                return String(texto)
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // só controle
                    .replace(/\s+/g, " ")
                    .trim();
            };
            // Para campo Tipo (DEPOSITO) pode ser mais agressivo
            const limparTexto = (texto) => {
                if (!texto) return "";
                return String(texto)
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^\x00-\x7F]/g, "")
                    .trim();
            };

            const endereco = limparTextoLeve(linha.Endereco);
            const numero = linha.Numero != null ? String(linha.Numero).trim() : 'SN';
            const cidade = limparTextoLeve(linha.Cidade);
            const estado = limparTextoLeve(linha.Estado);

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