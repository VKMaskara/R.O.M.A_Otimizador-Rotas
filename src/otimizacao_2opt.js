const totalKm = (melhorRota, matrizDistancias) => {
    let distanciaTotal = 0
 
    for (let i=0; i < melhorRota.length -1; i++){
        const origem = melhorRota[i]
        const destino = melhorRota[i+1]

        // Ela adiciona a distancia entre o ponto de origem e destino
        const trecho = matrizDistancias[origem].elements[destino]

        if(trecho.status === 'OK'){
            distanciaTotal += trecho.distance.value // em metros
        }else{
            distanciaTotal += 10000 // valor padrao em caso de erro
        }
        
    }

    // 2. VOLTA À BASE
    const ultimoPonto = melhorRota[melhorRota.length - 1];
    const primeiroPonto = melhorRota[0];
    const trechoRetorno = matrizDistancias[ultimoPonto].elements[primeiroPonto];

    if (trechoRetorno.status === 'OK') {
        distanciaTotal += trechoRetorno.distance.value;
    } else {
        distanciaTotal += 10000;
    }
    return distanciaTotal / 1000 // converte para km
}

export function aplicar2Opt(rotaInicial, matriz) {
    let melhorRota = [...rotaInicial];
    let melhorDistancia = totalKm(melhorRota, matriz); // Sua função de Km!
    let acc = 0;
    let melhorou = true;

    while (acc < 1000 && melhorou) {
        acc++;
        melhorou = false;

        for (let i = 1; i < melhorRota.length - 2; i++) {
            for (let j = i + 1; j < melhorRota.length - 1; j++) {
                
                // 1. Criamos a rota tentativa invertendo o meio
                const novaRota = inverterTrecho(melhorRota, i, j);
                
                // 2. Medimos o custo da nova rota
                const novaDistancia = totalKm(novaRota, matriz);

                // 3. A sua lógica do "if" entra aqui!
                if (novaDistancia < melhorDistancia) {
                    melhorDistancia = novaDistancia;
                    melhorRota = novaRota;
                    melhorou = true; // Avisa o 'while' para tentar de novo
                }
            }
        }
       
    }
    return melhorRota;
}
export { totalKm };

function inverterTrecho(rota, i, j) {
    const novaRota = rota.slice(0, i);
    const trechoInvertido = rota.slice(i, j + 1).reverse();
    novaRota.push(...trechoInvertido);
    novaRota.push(...rota.slice(j + 1));
    return novaRota;
}