const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
});

// IDs y constantes
const OWNER_ID = '752987736759205960';
const ALLOWED_USER_ID = '1023132788632862761';
const CHANNEL_ID = '1343749554905940058';
const HISTORY_FILE = './conversationHistory.json'; // Local como respaldo, pero usaremos GitHub
const MAX_MESSAGES = 20;

// Estado
const activeTrivia = new Map();
const activeChat = new Map();
let dataStore = { conversationHistory: {}, triviaRanking: {} }; // Estructura combinada

// Utilidades
const createEmbed = (color, title, description, footer = 'Miguel IA') => {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: footer })
        .setTimestamp();
};

const sendError = async (channel, message, suggestion = '¿Intentamos de nuevo?') => {
    const embed = createEmbed('#FF5555', '¡Ups!', `${message}\n${suggestion}`);
    await channel.send({ embeds: [embed] });
};

const sendSuccess = async (channel, title, message) => {
    const embed = createEmbed('#55FF55', title, message);
    await channel.send({ embeds: [embed] });
};

// Funciones de persistencia en GitHub
async function loadDataStore() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        return content ? JSON.parse(content) : { conversationHistory: {}, triviaRanking: {} };
    } catch (error) {
        console.error('Error al cargar datos desde GitHub:', error.message);
        return { conversationHistory: {}, triviaRanking: {} };
    }
}

async function saveDataStore(data) {
    try {
        let sha;
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
            );
            sha = response.data.sha;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Archivo no encontrado en GitHub, creando uno nuevo.');
            } else {
                throw error;
            }
        }

        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                message: 'Actualizar historial y ranking',
                content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
                sha: sha || undefined,
            },
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        console.log('Datos guardados en GitHub');
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
    }
}

function updateRanking(userId, username) {
    if (!dataStore.triviaRanking[userId]) {
        dataStore.triviaRanking[userId] = { username, score: 0 };
    }
    dataStore.triviaRanking[userId].score += 1;
    saveDataStore(dataStore);
}

function getRankingEmbed() {
    const sortedRanking = Object.entries(dataStore.triviaRanking)
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, 5);
    const description = sortedRanking.length > 0
        ? sortedRanking.map(([id, { username, score }], i) => `${i + 1}. **${username}**: ${score} puntos`).join('\n')
        : '¡Aún no hay puntajes! Juega con !trivia para empezar.';
    return createEmbed('#FFD700', '🏆 Ranking de Trivia', description);
}

// Trivia
async function manejarTrivia(message) {
    const trivia = obtenerPreguntaTrivia();
    const embedPregunta = createEmbed('#55FFFF', '🎲 ¡Pregunta de Trivia!',
        `${trivia.pregunta}\n\n${trivia.opciones.map((op, i) => `**${String.fromCharCode(65 + i)})** ${op}`).join('\n')}`,
        'Tienes 15 segundos para responder con A, B, C o D | Miguel IA'
    );
    const sentMessage = await message.channel.send({ embeds: [embedPregunta] });
    activeTrivia.set(message.channel.id, { id: sentMessage.id, correcta: trivia.respuesta, opciones: trivia.opciones });

    const opcionesValidas = ["a", "b", "c", "d"];
    const indiceCorrecto = trivia.opciones.indexOf(trivia.respuesta);
    const letraCorrecta = opcionesValidas[indiceCorrecto];

    try {
        const respuestas = await message.channel.awaitMessages({
            filter: (res) => res.author.id === message.author.id && opcionesValidas.includes(res.content.toLowerCase()),
            max: 1,
            time: 15000,
            errors: ['time']
        });
        const respuestaUsuario = respuestas.first().content.toLowerCase();
        activeTrivia.delete(message.channel.id);

        if (respuestaUsuario === letraCorrecta) {
            updateRanking(message.author.id, message.author.username);
            sendSuccess(message.channel, '🎉 ¡Correcto!',
                `¡Bien hecho, ${message.author.tag}! La respuesta correcta era **${trivia.respuesta}**. ¡Ganaste 1 punto! Usa !trivia para otra ronda o !ranking para ver los mejores.`);
        } else {
            sendError(message.channel, '❌ ¡Casi!',
                `Lo siento, ${message.author.tag}, la respuesta correcta era **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}). ¡Intenta otra vez con !trivia!`);
        }
    } catch (error) {
        activeTrivia.delete(message.channel.id);
        sendError(message.channel, '⏳ ¡Tiempo agotado!',
            `Se acabó el tiempo. La respuesta correcta era **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}). ¿Otra ronda? Usa !trivia`);
    }
}

// Evento principal
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const { author, content, channel, guild } = message;
    const isOwner = author.id === OWNER_ID;
    const isAllowedUser = author.id === ALLOWED_USER_ID;
    const isDM = !guild;
    const isTargetChannel = CHANNEL_ID && channel.id === CHANNEL_ID;

    console.log(`Mensaje recibido - Autor: ${author.id}, Contenido: ${content}, Es DM: ${isDM}`);

    if (!isOwner && !isAllowedUser) return;

    if (isAllowedUser) {
        let userHistory = dataStore.conversationHistory[author.id] || [];
        userHistory.push({ role: 'user', content, timestamp: new Date().toISOString() });
        if (userHistory.length > MAX_MESSAGES) userHistory.shift();
        dataStore.conversationHistory[author.id] = userHistory;
        saveDataStore(dataStore);
    }

    if (isOwner) {
        if (content.startsWith('responder')) {
            const reply = content.slice(9).trim();
            if (!reply) return sendError(channel, 'Escribe algo después de "responder".');
            try {
                const targetUser = await client.users.fetch(ALLOWED_USER_ID);
                const embed = createEmbed('#55FF55', '¡Respuesta de Miguel!', `${reply}\nSi necesitas más, usa !ayuda.`);
                await targetUser.send({ embeds: [embed] });
                sendSuccess(channel, '¡Éxito!', 'Respuesta enviada con éxito.');
            } catch (error) {
                console.error('Error al enviar respuesta:', error);
                sendError(channel, 'No pude enviar el mensaje.');
            }
            return;
        }
        if (content.startsWith('!update')) {
            const updateText = content.slice(7).trim();
            if (!updateText) return sendError(channel, 'Escribe las actualizaciones después de "!update".');
            try {
                const targetChannel = await client.channels.fetch(CHANNEL_ID);
                const embed = createEmbed('#FFD700', '📢 Actualización de Miguel IA', updateText);
                await targetChannel.send({ embeds: [embed] });
                sendSuccess(channel, '¡Éxito!', 'Actualización enviada al canal.');
            } catch (error) {
                console.error('Error al enviar actualización:', error);
                sendError(channel, 'No pude enviar la actualización.');
            }
            return;
        }
    }

    if (!isAllowedUser || (!isTargetChannel && !isDM)) return;

    if (activeTrivia.has(channel.id)) {
        const triviaData = activeTrivia.get(channel.id);
        const opcionesValidas = ['a', 'b', 'c', 'd'];
        if (opcionesValidas.includes(content.toLowerCase())) return;
    }

    if (activeChat.has(channel.id)) {
        try {
            const prompt = `Eres Miguel IA, un amigo cercano. Responde a "${content}" de forma natural y amigable, solo charlando, sin sugerir comandos ni ayuda técnica.`;
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                { inputs: prompt, parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.7 } },
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' } }
            );
            let aiReply = response.data[0]?.generated_text?.trim() || '¡Uy, me quedé en blanco! ¿Qué me cuentas tú?';
            dataStore.conversationHistory[author.id].push({ role: 'assistant', content: aiReply, timestamp: new Date().toISOString() });
            saveDataStore(dataStore);
            const embed = createEmbed('#55FFFF', '¡Charlando contigo!', aiReply);
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error en chat:', error);
            sendError(channel, 'Algo falló en el chat, pero sigo aquí.');
        }
        return;
    }

    if (content.startsWith('!ayuda')) {
        const issue = content.slice(6).trim();
        if (!issue) return sendError(channel, 'Dime qué necesitas después de "!ayuda".');
        try {
            const owner = await client.users.fetch(OWNER_ID);
            const embed = createEmbed('#FFD700', '¡Solicitud de ayuda!', `Se necesita ayuda con: "${issue}"`);
            await owner.send({ embeds: [embed] });
            const twilio = require('twilio');
            const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
            await clientTwilio.calls.create({
                twiml: `<Response><Say voice="alice">¡Despierta Miguel! Ayuda con ${issue}.</Say></Response>`,
                to: process.env.MY_PHONE_NUMBER,
                from: process.env.TWILIO_PHONE_NUMBER,
            });
            sendSuccess(channel, '¡Mensaje enviado!', 'Ya avisé a Miguel y lo estoy llamando.');
        } catch (error) {
            console.error('Error en !ayuda:', error);
            sendError(channel, 'No pude avisar a Miguel.');
        }
        return;
    }

    if (content.startsWith('!help')) {
        const embed = createEmbed('#55FF55', '¡Aquí tienes mis comandos!',
            'Estoy listo para ayudarte con:\n' +
            '- **!ayuda <problema>**: Pide ayuda.\n' +
            '- **!help**: Lista de comandos.\n' +
            '- **!trivia**: Juega trivia.\n' +
            '- **!ranking**: Muestra el ranking de trivia.\n' +
            '- **!sugerencias <idea>**: Envía ideas.\n' +
            '- **!chat**: Inicia modo charla.\n' +
            '- **hola**: Saludo especial.\n' +
            '- **Cualquier mensaje**: ¡Chatea conmigo!'
        );
        await channel.send({ embeds: [embed] });
        return;
    }

    if (content.startsWith('!sugerencias')) {
        const suggestion = content.slice(12).trim();
        if (!suggestion) return sendError(channel, 'Escribe tu sugerencia después de "!sugerencias".');
        try {
            const owner = await client.users.fetch(OWNER_ID);
            const embed = createEmbed('#FFD700', '💡 Nueva sugerencia', `Sugerencia: "${suggestion}"`);
            await owner.send({ embeds: [embed] });
            sendSuccess(channel, '¡Sugerencia enviada!', 'Tu idea está con Miguel. ¡Gracias!');
        } catch (error) {
            console.error('Error en !sugerencias:', error);
            sendError(channel, 'No pude enviar tu sugerencia.');
        }
        return;
    }

    if (content.startsWith('!trivia')) {
        await manejarTrivia(message);
        return;
    }

    if (content.startsWith('!ranking')) {
        const rankingEmbed = getRankingEmbed();
        await channel.send({ embeds: [rankingEmbed] });
        return;
    }

    if (content.startsWith('!chat')) {
        activeChat.set(channel.id, true);
        sendSuccess(channel, '¡Modo chat activado!', 'Ahora solo vamos a charlar. ¿Qué me cuentas?');
        return;
    }

    if (content.toLowerCase() === 'hola') {
        sendSuccess(channel, '¡Hola, qué alegría verte!', 'Soy Miguel IA, aquí para ayudarte. ¿Qué tienes en mente?');
        return;
    }

    try {
        const prompt = `Eres Miguel IA, creado por Miguel. Responde SOLO a "${content}" de manera clara y útil, como amigo. Si no está claro, pide detalles. Termina con nota positiva.`;
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
            { inputs: prompt, parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.3 } },
            { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        let aiReply = response.data[0]?.generated_text?.trim() || 'No entendí bien, ¿me das más detalles? ¡Quiero ayudarte!';
        dataStore.conversationHistory[author.id].push({ role: 'assistant', content: aiReply, timestamp: new Date().toISOString() });
        saveDataStore(dataStore);
        const embed = createEmbed('#55FF55', '¡Aquí estoy para ti!', aiReply, '¿Te sirvió? Reacciona con ✅ o ❌ • Miguel IA');
        const sentMessage = await channel.send({ embeds: [embed] });
        await sentMessage.react('✅');
        await sentMessage.react('❌');
    } catch (error) {
        console.error('Error en mensaje genérico:', error);
        sendError(channel, 'Algo falló, pero estoy aquí. ¿Otra pregunta?');
    }
});

client.once('ready', async () => {
    console.log('¡Miguel IA está listo!');
    client.user.setPresence({ activities: [{ name: "Listo para ayudarte", type: 0 }], status: 'online' });
    dataStore = await loadDataStore();
});

client.login(process.env.DISCORD_TOKEN);
