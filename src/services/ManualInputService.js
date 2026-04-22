import readline from 'readline';

/**
 * ManualInputService — permite cadastrar paradas (endereço + pacote)
 * de forma interativa pelo terminal, sem precisar de arquivo externo.
 *
 * Fluxo:
 *   1. Solicita o endereço do depósito (origem)
 *   2. Em loop, pergunta dados de cada entrega
 *   3. Usuário digita "fim" para encerrar
 */
export class ManualInputService {

    /**
     * Inicia o cadastro interativo pelo terminal.
     * @returns {Promise<Array>} Lista de paradas [{endereco, pacote, tipo}]
     */
    static async coletarParadasInterativamente() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const perguntar = (msg) =>
            new Promise(resolve => rl.question(msg, resp => resolve(resp.trim())));

        const paradas = [];

        console.log('\n📋 ROMA — Cadastro Manual de Entregas');
        console.log('─────────────────────────────────────────');
        console.log('Dica: Deixe um campo em branco e pressione Enter para pular.\n');

        // ── DEPÓSITO (Origem) ──────────────────────────────────────────
        console.log('📍 Primeiro, informe o endereço do DEPÓSITO (ponto de origem):');
        const deposito = await ManualInputService._coletarParada(perguntar, true);
        paradas.push({ ...deposito, tipo: 'DEPOSITO', pacote: null });

        console.log('\n─────────────────────────────────────────');
        console.log('📦 Agora cadastre as entregas.');
        console.log('   Digite "fim" no campo "Rua/Logradouro" para encerrar.\n');

        // ── ENTREGAS ──────────────────────────────────────────────────
        let contador = 1;

        while (true) {
            console.log(`📦 Entrega #${contador}:`);
            const rua = await perguntar('   Rua/Logradouro (ou "fim" para encerrar): ');

            if (rua.toLowerCase() === 'fim' || rua === '') break;

            const numero      = await perguntar('   Número (deixe em branco para S/N): ') || 'SN';
            const bairro      = await perguntar('   Bairro: ');
            const cidade      = await perguntar('   Cidade: ');
            const estado      = await perguntar('   Estado (ex: SP): ');

            const enderecoCompleto = [rua, numero, bairro, cidade, estado, 'Brasil']
                .filter(p => p && p !== 'SN' || p === 'SN')
                .join(', ')
                .replace(/,\s*,/g, ',')
                .trim();

            console.log('   ── Dados do pacote (opcional) ──');
            const pacoteId     = await perguntar('   Código do pacote (ex: PKG-001): ');
            const destinatario = await perguntar('   Nome do destinatário: ');
            const observacao   = await perguntar('   Observação (ex: Entregar na portaria): ');

            paradas.push({
                endereco: enderecoCompleto,
                tipo: 'ENTREGA',
                pacote: {
                    id:           pacoteId     || null,
                    destinatario: destinatario || null,
                    observacao:   observacao   || null,
                },
            });

            console.log(`   ✅ Entrega #${contador} adicionada.\n`);
            contador++;
        }

        rl.close();

        if (paradas.length < 2) {
            throw new Error('É necessário ao menos 1 depósito e 1 entrega para otimizar a rota.');
        }

        console.log(`\n✅ ${paradas.length - 1} entrega(s) cadastrada(s) manualmente.\n`);
        return paradas;
    }

    /**
     * Coleta os campos de endereço de uma parada (depósito ou entrega).
     * @private
     */
    static async _coletarParada(perguntar, isDeposito = false) {
        const prefixo = isDeposito ? '  [Depósito]' : '  ';

        const rua    = await perguntar(`${prefixo} Rua/Logradouro: `);
        const numero = await perguntar(`${prefixo} Número: `) || 'SN';
        const bairro = await perguntar(`${prefixo} Bairro: `);
        const cidade = await perguntar(`${prefixo} Cidade: `);
        const estado = await perguntar(`${prefixo} Estado (ex: SP): `);

        const enderecoCompleto = [rua, numero, bairro, cidade, estado, 'Brasil']
            .filter(p => p && p !== 'SN' || p === 'SN')
            .join(', ')
            .replace(/,\s*,/g, ',')
            .trim();

        return { endereco: enderecoCompleto };
    }
}
