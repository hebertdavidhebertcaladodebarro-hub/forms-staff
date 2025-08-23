document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO ---
    // Substitua pelos seus dados do Discord Developer Portal e Webhook
    const CLIENT_ID = '1408502052111515668';
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1408607997407658026/WzmSlUIT1TBZ3YhOy1k7vWnwaEqHYhfLLnhYVoJL-nUMRA_KIPZJs92e2XNFpwepG5vH'; 
console.log("URL do Webhook que está sendo usada:", WEBHOOK_URL); // <-- ADICIONE ESTA LINHA 
    // Certifique-se que esta URL é a mesma que você configurou no Redirect URIs
    const REDIRECT_URI = 'http://localhost:5500/bot/index.html';

    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const formScreen = document.getElementById('form-screen');
    const thankYouScreen = document.getElementById('thank-you-screen');
    const loginBtn = document.getElementById('login-btn');
    const questionContainer = document.getElementById('question-container');
    const navigationButtons = document.getElementById('navigation-buttons');
    const progressBar = document.getElementById('progress-bar');

    // --- DADOS DO FORMULÁRIO ---
    const questions = [
        { id: 'characterName', text: 'Nome do seu personagem', required: true, type: 'text' },
        { id: 'steamId', text: 'ID da sua conta da Steam', required: false, type: 'text' },
        { id: 'age', text: 'Sua idade', required: true, type: 'number' },
        { id: 'inFaction', text: 'Você faz parte de alguma facção atualmente?', required: false, type: 'text' },
        { id: 'factionHistory', text: 'Você tem histórico em facções? Se sim, conte um pouco', required: false, type: 'textarea' },
        { id: 'characterStory', text: 'Conte um pouco sobre o personagem que você deseja criar', required: true, type: 'textarea' },
        { id: 'factionIntent', text: 'Qual a sua intenção ao entrar na nossa facção?', required: false, type: 'textarea' },
        { id: 'organizationExpectation', text: 'O que você espera de nossa organização?', required: true, type: 'textarea' },
        { id: 'banHistory', text: 'Você já foi banido ou advertido no servidor? Se sim, por qual motivo?', required: false, type: 'textarea' },
        { id: 'rulesAware', text: 'Está ciente que o descumprimento das regras pode acarretar em punições internas e administrativas?', required: true, type: 'checkbox' }
    ];

    let currentQuestionIndex = 0;
    const userAnswers = {};
    let discordUser = null;

    // --- FUNÇÕES ---

    // Função para trocar de tela (login, form, etc.)
    const showScreen = (screen) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    };

    // Lida com o login OAuth2 do Discord
    const handleLogin = () => {
        const scope = 'identify';
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${scope}`;
        window.location.href = authUrl;
    };

    // Pega o token da URL após o redirect do Discord
    const getUrlFragment = () => {
        const fragment = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = fragment.get('access_token');
        if (accessToken) {
            fetchDiscordUser(accessToken);
        }
    };
    
    // Busca os dados do usuário do Discord usando o token
    const fetchDiscordUser = async (token) => {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch user data');
            discordUser = await response.json();
            // Limpa o hash da URL para não reenviar o token
            window.history.replaceState({}, document.title, window.location.pathname);
            startForm();
        } catch (error) {
            console.error('Error fetching Discord user:', error);
            alert('Não foi possível obter seus dados do Discord. Tente novamente.');
            showScreen(loginScreen);
        }
    };

    // Inicia o formulário após o login bem-sucedido
    const startForm = () => {
        userAnswers['discordUsername'] = `${discordUser.username}#${discordUser.discriminator}`;
        userAnswers['discordId'] = discordUser.id;
        showScreen(formScreen);
        displayQuestion();
    };

    // Exibe a pergunta atual
    const displayQuestion = () => {
        // Limpa containers
        questionContainer.innerHTML = '';
        navigationButtons.innerHTML = '';
        updateProgressBar();

        if (currentQuestionIndex >= questions.length) {
            displaySummary();
            return;
        }

        const q = questions[currentQuestionIndex];
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';

        let requiredSpan = q.required ? '<span class="required">*</span>' : '';
        let inputHtml = '';
        
        switch (q.type) {
            case 'textarea':
                inputHtml = `<textarea id="${q.id}" rows="5"></textarea>`;
                break;
            case 'checkbox':
                inputHtml = `
                    <div class="checkbox-container">
                        <input type="checkbox" id="${q.id}">
                        <label for="${q.id}">Sim, estou ciente.</label>
                    </div>`;
                break;
            default:
                 inputHtml = `<input type="${q.type}" id="${q.id}">`;
        }

        questionDiv.innerHTML = `
            <label for="${q.id}">${q.text} ${requiredSpan}</label>
            ${inputHtml}
        `;
        questionContainer.appendChild(questionDiv);

        // Adiciona botões de navegação
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Avançar';
        nextBtn.className = 'next-btn';
        nextBtn.onclick = handleNext;

        if (!q.required) {
            const skipBtn = document.createElement('button');
            skipBtn.textContent = 'Pular';
            skipBtn.className = 'skip-btn';
            skipBtn.onclick = handleSkip;
            navigationButtons.appendChild(skipBtn);
        }
        
        navigationButtons.appendChild(nextBtn);
    };
    
    // Lida com o clique no botão "Avançar"
    const handleNext = () => {
        const q = questions[currentQuestionIndex];
        const input = document.getElementById(q.id);
        const value = q.type === 'checkbox' ? input.checked : input.value.trim();

        if (q.required && (value === '' || value === false)) {
            alert('Esta pergunta é obrigatória.');
            return;
        }
        
        userAnswers[q.id] = value;
        currentQuestionIndex++;
        displayQuestion();
    };

    // Lida com o clique no botão "Pular"
    const handleSkip = () => {
        const q = questions[currentQuestionIndex];
        userAnswers[q.id] = 'Pulado';
        currentQuestionIndex++;
        displayQuestion();
    };
    
    // Atualiza a barra de progresso
    const updateProgressBar = () => {
        const progress = (currentQuestionIndex / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    };

    // Exibe o resumo das respostas antes do envio
    const displaySummary = () => {
        questionContainer.innerHTML = '<h2>Resumo da sua Aplicação</h2><p>Por favor, revise suas respostas antes de enviar.</p>';
        
        for (const q of questions) {
            const answer = userAnswers[q.id];
            const answerDisplay = (typeof answer === 'boolean') ? (answer ? 'Sim' : 'Não') : (answer || 'Não respondido');
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';
            summaryItem.innerHTML = `
                <strong>${q.text}</strong>
                <p>${answerDisplay}</p>
            `;
            questionContainer.appendChild(summaryItem);
        }
        
        navigationButtons.innerHTML = '';
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Enviar Aplicação';
        submitBtn.className = 'submit-btn';
        submitBtn.onclick = submitForm;
        navigationButtons.appendChild(submitBtn);
    };
    
    // Envia os dados para o Webhook do Discord
    const submitForm = async () => {
        navigationButtons.innerHTML = '<p>Enviando...</p>';
        
        const embedFields = questions.map(q => ({
            name: q.text,
            value: (typeof userAnswers[q.id] === 'boolean') ? (userAnswers[q.id] ? 'Sim' : 'Não') : (userAnswers[q.id] || 'Pulado'),
            inline: false
        }));
        
        const payload = {
            content: `Nova aplicação recebida de **${userAnswers.discordUsername}**!`,
            embeds: [{
                title: 'Respostas do Formulário',
                color: 5814783, // Cor azulada
                fields: [
                    { name: "Usuário Discord", value: `${userAnswers.discordUsername} (<@${userAnswers.discordId}>)`, inline: false},
                    ...embedFields
                ],
                footer: {
                    text: `ID do Usuário: ${userAnswers.discordId}`
                },
                timestamp: new Date().toISOString()
            }]
        };

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showScreen(thankYouScreen);
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Ocorreu um erro ao enviar sua aplicação. Tente novamente mais tarde.');
            displaySummary(); // Volta para a tela de resumo
        }
    };

    // --- INICIALIZAÇÃO ---
    loginBtn.onclick = handleLogin;
    getUrlFragment(); // Verifica se o usuário acabou de ser redirecionado do Discord

});







