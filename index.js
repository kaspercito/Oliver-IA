const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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
const OWNER_ID = '752987736759205960'; // Tu ID
const ALLOWED_USER_ID = '1023132788632862761'; // ID de Belén
const CHANNEL_ID = '1343749554905940058'; // Canal principal
const MAX_MESSAGES = 20;

const BOT_UPDATES = [
    '¡Trivia sin opciones con muchas preguntas!',
    'Comandos abreviados: !ch, !tr, !rk, !pp, !h, !re.',
    '!re es un juego: escribe la palabra primero y gana.',
    '!ch genera imágenes para preguntas como "¿Cómo es...?".'
];

// Preguntas sin opciones (interés general ampliado)
const preguntasTriviaSinOpciones = [
    { pregunta: "¿Cuál es la capital de Brasil?", respuesta: "brasilia" },
    { pregunta: "¿Cuál es la capital de Japón?", respuesta: "tokio" },
    { pregunta: "¿Cuál es la capital de Francia?", respuesta: "parís" },
    { pregunta: "¿Cuál es la capital de Australia?", respuesta: "canberra" },
    { pregunta: "¿Cuál es la capital de Canadá?", respuesta: "ottawa" },
    { pregunta: "¿Cuál es la capital de Rusia?", respuesta: "moscú" },
    { pregunta: "¿Cuál es la capital de India?", respuesta: "nueva delhi" },
    { pregunta: "¿Cuál es la capital de Sudáfrica?", respuesta: "pretoria" },
    { pregunta: "¿Cuál es la capital de Argentina?", respuesta: "buenos aires" },
    { pregunta: "¿Cuál es la capital de Egipto?", respuesta: "el cairo" },
    { pregunta: "¿Cuál es la capital de México?", respuesta: "ciudad de méxico" },
    { pregunta: "¿Cuál es la capital de Italia?", respuesta: "roma" },
    { pregunta: "¿Cuál es la capital de España?", respuesta: "madrid" },
    { pregunta: "¿Cuál es la capital de China?", respuesta: "pekín" },
    { pregunta: "¿Cuál es la capital de Alemania?", respuesta: "berlín" },
    { pregunta: "¿Cuál es la capital de Chile?", respuesta: "santiago" },
    { pregunta: "¿Cuál es la capital de Perú?", respuesta: "lima" },
    { pregunta: "¿Cuál es la capital de Colombia?", respuesta: "bogotá" },
    { pregunta: "¿Cuál es la capital de Nueva Zelanda?", respuesta: "wellington" },
    { pregunta: "¿Cuál es la capital de Suecia?", respuesta: "estocolmo" },
    { pregunta: "¿Qué elemento tiene el símbolo 'H'?", respuesta: "hidrógeno" },
    { pregunta: "¿Qué gas tiene la fórmula CO2?", respuesta: "dióxido de carbono" },
    { pregunta: "¿Qué elemento es un metal líquido a temperatura ambiente?", respuesta: "mercurio" },
    { pregunta: "¿Qué científico formuló la teoría de la relatividad?", respuesta: "albert einstein" },
    { pregunta: "¿Qué unidad mide la fuerza?", respuesta: "newton" },
    { pregunta: "¿En qué año llegó Colón a América?", respuesta: "1492" },
    { pregunta: "¿Qué civilización construyó las pirámides de Giza?", respuesta: "egipcia" },
    { pregunta: "¿Qué órgano bompea sangre en el cuerpo humano?", respuesta: "corazón" },
    { pregunta: "¿Qué juego tiene un personaje llamado Mario?", respuesta: "super mario" },
    { pregunta: "¿Qué película tiene a Jack Sparrow como pirata?", respuesta: "piratas del caribe" },
    { pregunta: "¿Qué princesa tiene una madrastra llamada Lady Tremaine?", respuesta: "cenicienta" },
    { pregunta: "¿Qué guerra ocurrió entre 1939 y 1945?", respuesta: "segunda guerra mundial" },
];

// Palabras aleatorias para el juego de reacciones
const palabrasAleatorias = [
    "genial", "cool", "bravo", "sí", "nope", "wow", "jaja", "bien", "mal", "top",
    "luz", "estrella", "risa", "fuego", "agua", "viento", "cielo", "tierra", "sol", "luna",
    "épico", "nice", "rápido", "lento", "fácil", "difícil", "super", "pro", "ok", "boom"
];

// Frases para PPM
const frasesPPM = [
    "el rápido zorro marrón salta sobre el perro perezoso",
    "la vida es como una caja de chocolates nunca sabes qué te va a tocar",
    "un pequeño paso para el hombre un gran salto para la humanidad",
    "el sol brilla más fuerte cuando estás feliz y rodeado de amigos",
    "la práctica hace al maestro no lo olvides nunca en tu camino",
    "el viento sopla suavemente entre los árboles altos del bosque verde",
    "la perseverancia y el esfuerzo siempre llevan a grandes logros personales",
    "un día claro con un cielo azul inspira a todos a soñar",
    "el río fluye tranquilo mientras las aves cantan al amanecer cada día",
    "la amistad verdadera se construye con confianza y apoyo mutuo siempre",
];

// Estado
const instanceId = uuidv4();
const activeTrivia = new Map();
const sentMessages = new Map();
const processedMessages = new Map();
const triviaLoops = new Map();
const ppmSessions = new Map();
const reactionGames = new Map();
let dataStore = { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {}, reactionStats: {}, reactionWins: {} };

// Utilidades
const createEmbed = (color, title, description, footer = 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!') => {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description || ' ')
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

// Función para limpiar texto (eliminar artículos y normalizar)
function cleanText(text) {
    return text.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/^(el|la|los|las)\s+/i, '');
}

// Función para generar imagen con Hugging Face (Stable Diffusion)
async function generateImage(prompt) {
    try {
        console.log(`Generando imagen para: "${prompt}"`);
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'image/png'
                },
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );
        console.log('Imagen generada exitosamente');
        const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:image/png;base64,${imageBase64}`;
    } catch (error) {
        console.error('Error al generar imagen:', error.message);
        throw error;
    }
}

// Funciones de persistencia en GitHub
async function loadDataStore() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        const loadedData = content ? JSON.parse(content) : { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {}, reactionStats: {}, reactionWins: {} };
        console.log('Datos cargados desde GitHub:', JSON.stringify(loadedData));
        return {
            conversationHistory: loadedData.conversationHistory || {},
            triviaRanking: loadedData.triviaRanking || {},
            personalPPMRecords: loadedData.personalPPMRecords || {},
            reactionStats: loadedData.reactionStats || {},
            reactionWins: loadedData.reactionWins || {}
        };
    } catch (error) {
        console.error('Error al cargar datos desde GitHub:', error.message);
        return { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {}, reactionStats: {}, reactionWins: {} };
    }
}

async function saveDataStore(data) {
    try {
        let sha;
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
            );
            sha = response.data.sha;
            console.log('Archivo existente encontrado, SHA:', sha);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Archivo no existe, creando uno nuevo...');
                await axios.put(
                    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                    {
                        message: 'Crear archivo inicial para historial y ranking',
                        content: Buffer.from(JSON.stringify({ conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {}, reactionStats: {}, reactionWins: {} }, null, 2)).toString('base64'),
                    },
                    { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
                );
                console.log('Archivo inicial creado en GitHub');
                return;
            } else {
                throw error;
            }
        }
        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                message: 'Actualizar historial, ranking y reacciones',
                content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
                sha: sha,
            },
            { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        console.log('Datos guardados correctamente en GitHub:', JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message, error.response?.data);
    }
}

// Función de Trivia
async function manejarTrivia(message) {
    console.log(`Instancia ${instanceId} - Iniciando trivia para ${message.author.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    let numQuestions = 10;
    const args = message.content.split(' ').slice(1);
    if (args.length > 0 && !isNaN(args[0]) && args[0] >= 10) numQuestions = parseInt(args[0]);

    for (let i = 0; i < numQuestions; i++) {
        const trivia = obtenerPreguntaTriviaSinOpciones();
        if (!trivia) {
            await sendError(message.channel, 'No hay más preguntas disponibles.');
            break;
        }
        const embedPregunta = createEmbed('#55FFFF', `🎲 ¡Pregunta ${i + 1} de ${numQuestions}!`,
            `${trivia.pregunta}\n\nEscribe tu respuesta (60 segundos), ${userName}.`);
        const sentMessage = await message.channel.send({ embeds: [embedPregunta] });
        activeTrivia.set(message.channel.id, { id: sentMessage.id, correcta: trivia.respuesta, timestamp: Date.now(), userId: message.author.id });

        try {
            console.log(`Esperando respuesta para pregunta ${i + 1}: ${trivia.pregunta}`);
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && res.content.trim().length > 0,
                max: 1,
                time: 60000,
                errors: ['time']
            });
            const respuestaUsuario = respuestas.first().content;
            const cleanedUserResponse = cleanText(respuestaUsuario);
            const cleanedCorrectResponse = cleanText(trivia.respuesta);
            console.log(`Respuesta recibida: "${respuestaUsuario}" (limpia: "${cleanedUserResponse}") vs correcta: "${cleanedCorrectResponse}"`);
            activeTrivia.delete(message.channel.id);

            if (cleanedUserResponse === cleanedCorrectResponse) {
                updateRanking(message.author.id, message.author.username);
                await sendSuccess(message.channel, '🎉 ¡Correcto!',
                    `¡Bien hecho, ${userName}! La respuesta correcta era **${trivia.respuesta}**. ¡Ganaste 1 punto!`);
            } else {
                await sendError(message.channel, '❌ ¡Casi!',
                    `Lo siento, ${userName}, la respuesta correcta era **${trivia.respuesta}**. Tu respuesta fue "${respuestaUsuario}".`);
            }
        } catch (error) {
            console.log(`Tiempo agotado o error en pregunta ${i + 1}: ${trivia.pregunta}`, error);
            activeTrivia.delete(message.channel.id);
            await sendError(message.channel, '⏳ ¡Tiempo agotado!',
                `Se acabó el tiempo, ${userName}. La respuesta correcta era **${trivia.respuesta}**.`);
        }
    }
    await sendSuccess(message.channel, '🏁 ¡Trivia Terminada!', `¡Completaste las ${numQuestions} preguntas, ${userName}! Usa !rk para ver tu puntaje.`);
}

// Función para manejar PPM
async function manejarPPM(message) {
    console.log(`Instancia ${instanceId} - Iniciando PPM para ${message.author.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (ppmSessions.has(message.author.id)) {
        return sendError(message.channel, `Ya tienes una prueba activa, ${userName}. Termina la actual primero.`);
    }

    async function startTest() {
        const countdownEmbed = createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en 3...`);
        const countdownMessage = await message.channel.send({ embeds: [countdownEmbed] });

        for (let i = 2; i > 0; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const updatedEmbed = createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en ${i}...`);
            await countdownMessage.edit({ embeds: [updatedEmbed] });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        const goEmbed = createEmbed('#00FF00', '🚀 ¡Ya!', `¡Adelante, ${userName}!`);
        await countdownMessage.edit({ embeds: [goEmbed] });

        const frase = frasesPPM[Math.floor(Math.random() * frasesPPM.length)];
        const startTime = Date.now();
        const embed = createEmbed('#55FFFF', '📝 Prueba de Mecanografía',
            `Escribe esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTienes 60 segundos, ${userName}.`);
        await message.channel.send({ embeds: [embed] });

        ppmSessions.set(message.author.id, { frase, startTime });

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id,
                max: 1,
                time: 60000,
                errors: ['time']
            });
            const respuestaUsuario = respuestas.first().content;
            const endTime = Date.now();
            ppmSessions.delete(message.author.id);

            const tiempoSegundos = (endTime - startTime) / 1000;
            const palabras = frase.split(' ').length;
            const ppm = Math.round((palabras / tiempoSegundos) * 60);

            if (!dataStore.personalPPMRecords[message.author.id]) {
                dataStore.personalPPMRecords[message.author.id] = [];
            }
            const newRecord = { ppm, timestamp: new Date().toISOString() };
            dataStore.personalPPMRecords[message.author.id].push(newRecord);
            await saveDataStore(dataStore);

            if (cleanText(respuestaUsuario) === cleanText(frase)) {
                await sendSuccess(message.channel, '🎉 ¡Perfecto!',
                    `¡Bien hecho, ${userName}! Escribiste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu velocidad: **${ppm} PPM**. Usa !rk para ver tus récords.`);
            } else {
                await sendError(message.channel, '❌ ¡Casi!',
                    `Lo siento, ${userName}, no escribiste la frase correctamente. Tu respuesta fue "${respuestaUsuario}". ¡Intenta de nuevo con !pp!`);
                await startTest();
            }
        } catch (error) {
            ppmSessions.delete(message.author.id);
            await sendError(message.channel, '⏳ ¡Tiempo agotado!',
                `Se acabó el tiempo, ${userName}. La frase era: **${frase}**. Usa !pp para intentarlo de nuevo.`);
        }
    }

    await startTest();
}

// Función para manejar el juego de reacciones
async function manejarReacciones(message) {
    console.log(`Instancia ${instanceId} - Iniciando juego de reacciones en canal ${message.channel.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (reactionGames.has(message.channel.id)) {
        return sendError(message.channel, `Ya hay un juego de reacciones activo en este canal, ${userName}. ¡Espera a que termine!`);
    }

    const palabra = palabrasAleatorias[Math.floor(Math.random() * palabrasAleatorias.length)];
    const embed = createEmbed('#FFD700', '🏁 ¡Juego de Reacciones!', 
        `¡Escribe esta palabra lo más rápido que puedas: **${palabra}**!\n\nEl primero en escribirla gana. Tienes 30 segundos.`);
    await message.channel.send({ embeds: [embed] });

    reactionGames.set(message.channel.id, { palabra, timestamp: Date.now() });

    try {
        const respuestas = await message.channel.awaitMessages({
            filter: (res) => res.content.toLowerCase().trim() === palabra,
            max: 1,
            time: 30000,
            errors: ['time']
        });
        const ganador = respuestas.first().author;
        const ganadorName = ganador.id === OWNER_ID ? 'Miguel' : 'Belén';
        reactionGames.delete(message.channel.id);

        // Actualizar victorias en reacciones
        if (!dataStore.reactionWins) dataStore.reactionWins = {};
        if (!dataStore.reactionWins[ganador.id]) {
            dataStore.reactionWins[ganador.id] = { username: ganador.username, wins: 0 };
        }
        dataStore.reactionWins[ganador.id].wins += 1;

        // Registrar la palabra usada en reactionStats (aunque no se mostrará en el ranking)
        if (!dataStore.reactionStats[ganador.id]) dataStore.reactionStats[ganador.id] = {};
        if (!dataStore.reactionStats[ganador.id][palabra]) dataStore.reactionStats[ganador.id][palabra] = { count: 0 };
        dataStore.reactionStats[ganador.id][palabra].count += 1;

        await saveDataStore(dataStore);
        console.log(`Datos guardados para ${ganadorName}: ${JSON.stringify(dataStore.reactionWins)} y ${JSON.stringify(dataStore.reactionStats)}`);

        await sendSuccess(message.channel, '🎉 ¡Ganador!',
            `¡Felicidades, ${ganadorName}! Fuiste el primero en escribir **${palabra}**. ¡Eres rapidísimo! Mira tu progreso con !rk.`);
    } catch (error) {
        reactionGames.delete(message.channel.id);
        await sendError(message.channel, '⏳ ¡Tiempo agotado!',
            `Nadie escribió **${palabra}** a tiempo. ¡Mejor suerte la próxima vez con !re!`);
    }
}

function obtenerPreguntaTriviaSinOpciones() {
    if (preguntasTriviaSinOpciones.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * preguntasTriviaSinOpciones.length);
    return preguntasTriviaSinOpciones[randomIndex];
}

function updateRanking(userId, username) {
    if (!dataStore.triviaRanking) dataStore.triviaRanking = {};
    if (!dataStore.triviaRanking[userId]) {
        dataStore.triviaRanking[userId] = { username, score: 0 };
    }
    dataStore.triviaRanking[userId].score += 1;
    saveDataStore(dataStore);
}

function getCombinedRankingEmbed(userId, username) {
    const triviaRanking = Object.entries(dataStore.triviaRanking || {})
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, 5)
        .map(([id, { username: u, score }], i) => `${i + 1}. **${u}**: ${score} puntos (Trivia)`);

    const personalPPMRecords = (dataStore.personalPPMRecords[userId] || [])
        .sort((a, b) => b.ppm - a.ppm)
        .slice(0, 5)
        .map((record, i) => `${i + 1}. **${record.ppm} PPM** - ${new Date(record.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);

    const reactionWins = Object.entries(dataStore.reactionWins || {})
        .sort(([, a], [, b]) => b.wins - a.wins)
        .slice(0, 5)
        .map(([id, { username: u, wins }], i) => `${i + 1}. **${u}**: ${wins} victorias (Reacciones)`);

    const description = [
        triviaRanking.length > 0 ? '**Ranking de Trivia:**\n' + triviaRanking.join('\n') : '¡Aún no hay puntajes de trivia!',
        personalPPMRecords.length > 0 ? '\n**Tus Récords de Mecanografía:**\n' + personalPPMRecords.join('\n') : '\n¡Aún no tienes récords de mecanografía!',
        reactionWins.length > 0 ? '\n**Victorias en Reacciones:**\n' + reactionWins.join('\n') : '\n¡Aún no hay victorias en reacciones!'
    ].join('\n');

    return createEmbed('#FFD700', '🏆 Ranking Combinado', description);
}

// Evento ready
client.once('ready', async () => {
    console.log(`¡Miguel IA está listo! Instancia: ${instanceId}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudar a Miguel y Belén", type: 0 }], status: 'online' });
    dataStore = await loadDataStore();
});

// Evento messageCreate
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const { author, content, channel, guild } = message;
    const isOwner = author.id === OWNER_ID;
    const isAllowedUser = author.id === ALLOWED_USER_ID;
    const isDM = !guild;
    const isTargetChannel = CHANNEL_ID && channel.id === CHANNEL_ID;

    if (!isOwner && !isAllowedUser) return;

    const userName = isOwner ? 'Miguel' : 'Belén';

    if (processedMessages.has(message.id)) {
        const processedTime = processedMessages.get(message.id);
        if (Date.now() - processedTime < 1000) return;
    }
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

    if (content.startsWith('!chat') || content.startsWith('!ch')) {
        const chatMessage = content.startsWith('!chat') ? content.slice(5).trim() : content.slice(3).trim();
        if (!chatMessage) return sendError(channel, `Escribe un mensaje después de "!ch", ${userName}.`);

        const waitingEmbed = createEmbed('#55FFFF', `¡Un momento, ${userName}!`, 'Espera, estoy buscando una respuesta...');
        const waitingMessage = await channel.send({ embeds: [waitingEmbed] });

        try {
            let aiReply;
            const lowerMessage = chatMessage.toLowerCase();

            // Detectar saludo simple como "Hola"
            if (lowerMessage === 'hola') {
                aiReply = `¡Hola, ${userName}! ¿En qué puedo ayudarte hoy?`;
                const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy para ti, ${userName}!`, aiReply);
                const sentMessage = await channel.send({ embeds: [finalEmbed] });
                await waitingMessage.delete();
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                sentMessages.set(sentMessage.id, { content: aiReply, originalQuestion: chatMessage, timestamp: new Date().toISOString(), message: sentMessage });
            }
            // Detectar preguntas matemáticas simples como "cuánto es X + Y"
            else if (lowerMessage.match(/cu[áa]nto es (\d+)\s*\+s*(\d+)/)) {
                const mathMatch = lowerMessage.match(/cu[áa]nto es (\d+)\s*\+s*(\d+)/);
                const num1 = parseInt(mathMatch[1]);
                const num2 = parseInt(mathMatch[2]);
                const result = num1 + num2;
                aiReply = `¡Hola, ${userName}! Cuanto es ${num1} + ${num2}... ¡Fácil! La respuesta es **${result}**. ¿Necesitas ayuda con más cuentas?`;
                const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy para ti, ${userName}!`, aiReply);
                const sentMessage = await channel.send({ embeds: [finalEmbed] });
                await waitingMessage.delete();
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                sentMessages.set(sentMessage.id, { content: aiReply, originalQuestion: chatMessage, timestamp: new Date().toISOString(), message: sentMessage });
            }
            // Detectar pedidos de letras de canciones explícitos
            else if (lowerMessage.includes('letra') && (lowerMessage.includes('canción') || lowerMessage.includes('cancion') || lowerMessage.includes('que me des'))) {
                aiReply = `¡Hola, ${userName}! No tengo acceso directo a las letras de canciones para darte la exacta de "${chatMessage.split(' - ')[1] || chatMessage}". Sin embargo, puedo sugerirte buscarla en sitios confiables como Genius (genius.com) o Letras.com, o puedo darte información sobre el artista o la canción si quieres. ¿Qué prefieres?`;
                const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy para ti, ${userName}!`, aiReply);
                const sentMessage = await channel.send({ embeds: [finalEmbed] });
                await waitingMessage.delete();
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                sentMessages.set(sentMessage.id, { content: aiReply, originalQuestion: chatMessage, timestamp: new Date().toISOString(), message: sentMessage });
            }
            // Condición especial para "¿Cómo es una rata blanca?" con imagen incrustada
            else if (lowerMessage.includes('cómo es') && lowerMessage.includes('rata blanca')) {
                const imgurLink = 'https://i.imgur.com/mjOqwH6.png';
                aiReply = `¡Hola, ${userName}! Una rata blanca es un pequeño roedor con un pelaje blanco puro, ojos rosados o rojos (por ser albina), orejas redondeadas y una cola larga y rosada. Son súper curiosas y amigables, ¡ideales como mascotas! Mira esta foto que encontré:`;
                const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy para ti, ${userName}!`, aiReply);
                finalEmbed.setImage(imgurLink);
                const sentMessage = await channel.send({ embeds: [finalEmbed] });
                await waitingMessage.delete();
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                sentMessages.set(sentMessage.id, { content: aiReply, originalQuestion: chatMessage, timestamp: new Date().toISOString(), message: sentMessage });
            }
            // Condición existente para rata negra con imagen generada
            else if (lowerMessage.includes('cómo es') && (lowerMessage.includes('rata negra') || lowerMessage.includes('rata') || lowerMessage.includes('negra'))) {
                aiReply = `¡Hola, ${userName}! Una rata negra, o "Rattus rattus", es un roedor pequeño con un cuerpo alargado, generalmente de color negro o gris oscuro. Tiene un hocico puntiagudo, orejas grandes y una cola larga y delgada. Son ágiles trepadoras y suelen vivir en lugares altos como áticos o árboles. Aquí tienes una imagen generada de una rata negra:`;
                const imageUrl = await generateImage("A realistic black rat (Rattus rattus) with a pointed snout, large ears, and a long thin tail");
                const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy para ti, ${userName}!`, aiReply);
                finalEmbed.setImage(imageUrl);
                const sentMessage = await channel.send({ embeds: [finalEmbed] });
                await waitingMessage.delete();
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                sentMessages.set(sentMessage.id, { content: aiReply, originalQuestion: chatMessage, timestamp: new Date().toISOString(), message: sentMessage });
            }
            // Respuesta general para otras preguntas
            else {
                const prompt = `Eres Miguel IA, creado por Miguel para ayudar a ${userName}. Responde a "${chatMessage}" de forma natural, amigable y detallada, explicando el tema si es una pregunta, con pasos claros si aplica. Si es un cálculo matemático, resuélvelo directamente. Si no tienes información precisa (como letras de canciones), no inventes nada; admite que no sabes y sugiere algo útil como buscar en fuentes confiables. Asegúrate de completar todas las ideas y no dejar frases cortadas.`;
                console.log(`Enviando solicitud a Hugging Face por ${userName}: "${chatMessage}"`);
                const response = await axios.post(
                    'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                    { 
                        inputs: prompt, 
                        parameters: { 
                            max_new_tokens: 1000, 
                            return_full_text: false, 
                            temperature: 0.6 
                        } 
                    },
                    { 
                        headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' },
                        timeout: 30000
                    }
                );

                console.log(`Respuesta recibida de Hugging Face: ${JSON.stringify(response.data)}`);
                aiReply = response.data[0]?.generated_text?.trim();
                if (!aiReply || aiReply.length < 20) {
                    aiReply = `¡Hola, ${userName}! Sobre "${chatMessage}", no tengo mucho que decir esta vez, pero estoy aquí para ayudarte. ¿Qué más quieres saber?`;
                }
                aiReply += `\n\n¿Te sirvió esta respuesta?`;

                let userHistory = dataStore.conversationHistory[author.id] || [];
                userHistory.push({ role: 'assistant', content: aiReply, timestamp: new Date().toISOString() });
                if (userHistory.length > MAX_MESSAGES) userHistory.shift();
                dataStore.conversationHistory[author.id] = userHistory;
                await saveDataStore(dataStore);

                const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy para ti, ${userName}!`, aiReply);
                const sentMessage = await channel.send({ embeds: [finalEmbed] });
                await waitingMessage.delete();
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                sentMessages.set(sentMessage.id, { content: aiReply, originalQuestion: chatMessage, timestamp: new Date().toISOString(), message: sentMessage });
            }
            console.log(`Respuesta enviada a ${userName} para "${chatMessage}"`);
        } catch (error) {
            console.error(`Error en !ch para "${chatMessage}": ${error.message}`, error.stack);
            const errorEmbed = createEmbed('#FF5555', '¡Ups!', 
                `Algo falló, ${userName}. ${error.code === 'ECONNABORTED' ? 'Tardé demasiado en pensar.' : 'Hubo un problema con mi cerebro artificial.'} ¡Intenta de nuevo con !ch!`);
            await channel.send({ embeds: [errorEmbed] });
            await waitingMessage.delete();
            console.log(`Error enviado a ${userName} para "${chatMessage}"`);
        }
        return;
    }

    if (content.startsWith('!trivia') || content.startsWith('!tr')) {
        await manejarTrivia(message);
        return;
    }

    if (content.startsWith('!ranking') || content.startsWith('!rk')) {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (content.startsWith('!ppm') || content.startsWith('!pp')) {
        await manejarPPM(message);
        return;
    }

    if (content.startsWith('!reacciones') || content.startsWith('!re')) {
        await manejarReacciones(message);
        return;
    }

    if (content.startsWith('!help') || content.startsWith('!h')) {
        const embed = createEmbed('#55FF55', `¡Comandos para ti, ${userName}!`,
            'Aquí tienes lo que puedo hacer:\n' +
            '- **!ch / !chat [mensaje]**: Charla conmigo (prueba "¿Cómo es...?" o "cuánto es..." para algo especial).\n' +
            '- **!tr / !trivia [n]**: Trivia (mínimo 10).\n' +
            '- **!pp / !ppm**: Prueba de mecanografía.\n' +
            '- **!rk / !ranking**: Ver puntajes y reacciones.\n' +
            '- **!re / !reacciones**: Juego: escribe la palabra primero.\n' +
            '- **!h / !help**: Lista de comandos.\n' +
            '- **hola**: Saludo especial.');
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (content.toLowerCase() === 'hola') {
        sendSuccess(channel, `¡Hola, ${userName}!`, `Soy Miguel IA, aquí para ayudarte. Prueba !tr, !pp o !re para un juego rápido. ¿Qué tienes en mente?`);
        return;
    }
});

// Evento messageReactionAdd
client.on('messageReactionAdd', async (reaction, user) => {
    if (!sentMessages.has(reaction.message.id)) return;
    if (user.id !== OWNER_ID && user.id !== ALLOWED_USER_ID) return;

    const messageData = sentMessages.get(reaction.message.id);
    const userName = user.id === OWNER_ID ? 'Miguel' : 'Belén';
    const reactionText = reaction.emoji.name.toLowerCase();

    if (palabrasAleatorias.includes(reactionText)) {
        if (!dataStore.reactionStats[user.id]) dataStore.reactionStats[user.id] = {};
        if (!dataStore.reactionStats[user.id][reactionText]) dataStore.reactionStats[user.id][reactionText] = { count: 0 };
        dataStore.reactionStats[user.id][reactionText].count += 1;
        await saveDataStore(dataStore);

        const embed = createEmbed('#FFD700', '¡Reacción divertida!',
            `¡${userName} reaccionó con "${reactionText}" a "${messageData.content}"! Mira tus stats en !rk.`);
        await reaction.message.channel.send({ embeds: [embed] });
    }

    if (reaction.emoji.name === '❌') {
        const alternativePrompt = `Eres Miguel IA, creado por Miguel. ${userName} no quedó satisfecho con tu respuesta anterior a "${messageData.originalQuestion}": "${messageData.content}". Da una respuesta alternativa, clara y útil, sin repetir la anterior.`;
        try {
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                { inputs: alternativePrompt, parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.6 } },
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 30000 }
            );
            let alternativeReply = response.data[0]?.generated_text?.trim() || `No se me ocurre algo mejor ahora, ${userName}. ¿Qué tal si me das más detalles?`;
            alternativeReply += `\n\n¿Te sirvió esta respuesta?`;
            const alternativeEmbed = createEmbed('#55FFFF', `¡Probemos otra vez, ${userName}!`, alternativeReply);
            const newSentMessage = await messageData.message.channel.send({ embeds: [alternativeEmbed] });
            await newSentMessage.react('✅');
            await newSentMessage.react('❌');
            sentMessages.set(newSentMessage.id, { content: alternativeReply, originalQuestion: messageData.originalQuestion, timestamp: new Date().toISOString(), message: newSentMessage });
        } catch (error) {
            console.error('Error al generar respuesta alternativa:', error);
            sendError(messageData.message.channel, `No pude encontrar una mejor respuesta ahora, ${userName}.`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
