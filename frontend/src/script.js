fetch('http://localhost:3000/projects', {
    method: 'GET',
    headers: {
        'x-team-token': 'equipe-alpha-2026'
    }
})
.then(resposta => resposta.json())
.then(dados => {
    console.log("Deu certo! Olha os dados aqui:", dados);
})
.catch(erro => console.error("Erro:", erro));