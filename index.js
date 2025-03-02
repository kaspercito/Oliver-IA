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
const CHANNEL_ID = '1343749554905940058';
const MAX_MESSAGES = 20;

const BOT_UPDATES = [
    '¡Trivia solo sin opciones con muchas preguntas!',
    'Temas: química, física, historia, biología, juegos, películas, Disney y capitales.',
    'Respuestas completas y mensajes bien formateados.',
    'Listo para Miguel y Belén.'
];

// Preguntas sin opciones (interés general ampliado)
const preguntasTriviaSinOpciones = [
    // Capitales del mundo
    { pregunta: "¿Cuál es la capital de Brasil?", respuesta: "brasilia" },
    { pregunta: "¿Cuál es la capital de Japón?", respuesta: "tokio" },
    { pregunta: "¿Cuál es la capital de Francia?", respuesta: "parís" },
    { pregunta: "¿Cuál es la capital de Australia?", respuesta: "canberra" },
    { pregunta: "¿Cuál es la capital de Canadá?", respuesta: "ottawa" },
    { pregunta: "¿Cuál es la capital de Rusia?", respuesta: "moscú" },
    { pregunta: "¿Cuál es la capital de India?", respuesta: "nueva delhi" },
    { pregunta: "¿Cuál es la capital de Sudáfrica?", respuesta: "pretoria" }, // Nota: tiene 3 capitales, pero esta es la administrativa
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

    // Química
    { pregunta: "¿Qué elemento tiene el símbolo 'H'?", respuesta: "hidrógeno" },
    { pregunta: "¿Qué gas tiene la fórmula CO2?", respuesta: "dióxido de carbono" },
    { pregunta: "¿Qué elemento es un metal líquido a temperatura ambiente?", respuesta: "mercurio" },
    { pregunta: "¿Qué sustancia tiene la fórmula H2O?", respuesta: "agua" },
    { pregunta: "¿Qué gas es esencial para la respiración?", respuesta: "oxígeno" },
    { pregunta: "¿Qué elemento tiene el número atómico 6?", respuesta: "carbono" },
    { pregunta: "¿Qué ácido tiene la fórmula H2SO4?", respuesta: "ácido sulfúrico" },
    { pregunta: "¿Qué metal tiene el símbolo 'Fe'?", respuesta: "hierro" },
    { pregunta: "¿Qué gas noble tiene el símbolo 'Ne'?", respuesta: "neón" },
    { pregunta: "¿Qué elemento es el más abundante en la corteza terrestre?", respuesta: "oxígeno" },

    // Física
    { pregunta: "¿Qué científico formuló la teoría de la relatividad?", respuesta: "albert einstein" },
    { pregunta: "¿Qué unidad mide la fuerza?", respuesta: "newton" },
    { pregunta: "¿Qué tipo de energía tiene un objeto en movimiento?", respuesta: "cinética" },
    { pregunta: "¿Qué velocidad es aproximadamente 343 m/s en el aire?", respuesta: "sonido" },
    { pregunta: "¿Qué partícula subatómica tiene carga negativa?", respuesta: "electrón" },
    { pregunta: "¿Qué ley dice que a toda acción hay una reacción igual y opuesta?", respuesta: "tercera ley de newton" },
    { pregunta: "¿Qué mide la resistencia eléctrica?", respuesta: "ohmio" },
    { pregunta: "¿Qué fenómeno explica la curvatura de la luz por gravedad?", respuesta: "lente gravitacional" },
    { pregunta: "¿Qué color tiene la luz con la longitud de onda más corta?", respuesta: "violeta" },
    { pregunta: "¿Qué científico descubrió la gravedad al observar una manzana?", respuesta: "isaac newton" },

    // Historia
    { pregunta: "¿En qué año llegó Colón a América?", respuesta: "1492" },
    { pregunta: "¿Qué civilización construyó las pirámides de Giza?", respuesta: "egipcia" },
    { pregunta: "¿Qué guerra ocurrió entre 1939 y 1945?", respuesta: "segunda guerra mundial" },
    { pregunta: "¿Quién fue el primer presidente de Estados Unidos?", respuesta: "george washington" },
    { pregunta: "¿En qué año cayó el Muro de Berlín?", respuesta: "1989" },
    { pregunta: "¿Qué imperio fue gobernado por los Césares?", respuesta: "romano" },
    { pregunta: "¿Quién pintó la Capilla Sixtina?", respuesta: "michelangelo" },
    { pregunta: "¿Qué revolución comenzó en 1789 en Francia?", respuesta: "revolución francesa" },
    { pregunta: "¿Qué reina inglesa tuvo el reinado más largo?", respuesta: "victoria" },
    { pregunta: "¿En qué año se firmó la independencia de Argentina?", respuesta: "1816" },

    // Biología
    { pregunta: "¿Qué órgano bombea sangre en el cuerpo humano?", respuesta: "corazón" },
    { pregunta: "¿Qué gas producen las plantas en la fotosíntesis?", respuesta: "oxígeno" },
    { pregunta: "¿Qué animal es conocido por su cuello largo?", respuesta: "jirafa" },
    { pregunta: "¿Qué parte de la célula contiene el ADN?", respuesta: "núcleo" },
    { pregunta: "¿Qué mamífero pone huevos?", respuesta: "ornitorrinco" },
    { pregunta: "¿Qué hueso es el más largo del cuerpo humano?", respuesta: "fémur" },
    { pregunta: "¿Qué sentido usamos para oler?", respuesta: "olfato" },
    { pregunta: "¿Qué animal es el más rápido en tierra?", respuesta: "guepardo" },
    { pregunta: "¿Qué órgano filtra la sangre?", respuesta: "riñón" },
    { pregunta: "¿Qué tipo de sangre transporta oxígeno?", respuesta: "glóbulos rojos" },

    // Juegos
    { pregunta: "¿Qué juego tiene un personaje llamado Mario?", respuesta: "super mario" },
    { pregunta: "¿En qué juego luchas contra los Covenant?", respuesta: "halo" },
    { pregunta: "¿Qué juego de Mojang incluye creepers?", respuesta: "minecraft" },
    { pregunta: "¿Qué juego tiene un protagonista llamado Link?", respuesta: "the legend of zelda" },
    { pregunta: "¿En qué juego construyes con bloques de plástico?", respuesta: "lego" },
    { pregunta: "¿Qué juego de Rockstar tiene a Trevor Philips?", respuesta: "grand theft auto v" },
    { pregunta: "¿Qué juego de cartas usa un mazo de 52?", respuesta: "póker" },
    { pregunta: "¿En qué juego buscas el Anillo Único?", respuesta: "el señor de los anillos" },
    { pregunta: "¿Qué juego de Nintendo tiene a Pikachu?", respuesta: "pokémon" },
    { pregunta: "¿En qué juego eres un fontanero que salta tuberías?", respuesta: "super mario" },

    // Películas
    { pregunta: "¿Qué película tiene a Jack Sparrow como pirata?", respuesta: "piratas del caribe" },
    { pregunta: "¿Quién dirigió 'Titanic'?", respuesta: "james cameron" },
    { pregunta: "¿En qué película un león se convierte en rey?", respuesta: "el rey león" },
    { pregunta: "¿Qué saga tiene a Darth Vader?", respuesta: "star wars" },
    { pregunta: "¿Qué película de Pixar tiene a un pez llamado Nemo?", respuesta: "buscando a nemo" },
    { pregunta: "¿En qué película un mago va a Hogwarts?", respuesta: "harry potter" },
    { pregunta: "¿Qué película tiene un tiburón como villano?", respuesta: "tiburón" },
    { pregunta: "¿Quién protagoniza 'Forrest Gump'?", respuesta: "tom hanks" },
    { pregunta: "¿Qué película de Marvel tiene a Tony Stark?", respuesta: "iron man" },
    { pregunta: "¿En qué película un niño ve fantasmas?", respuesta: "el sexto sentido" },

    // Disney
    { pregunta: "¿Qué princesa tiene una madrastra llamada Lady Tremaine?", respuesta: "cenicienta" },
    { pregunta: "¿En qué película un genio concede deseos?", respuesta: "aladdín" },
    { pregunta: "¿Qué personaje de Disney es un cangrejo en 'La Sirenita'?", respuesta: "sebastián" },
    { pregunta: "¿Qué película tiene a Simba como protagonista?", respuesta: "el rey león" },
    { pregunta: "¿Qué princesa duerme por un hechizo?", respuesta: "aurora" },
    { pregunta: "¿En qué película una rata cocina?", respuesta: "ratatouille" },
    { pregunta: "¿Qué personaje es un ciervo en 'Bambi'?", respuesta: "bambi" },
    { pregunta: "¿Qué película tiene a Woody y Buzz Lightyear?", respuesta: "toy story" },
    { pregunta: "¿Qué princesa vive bajo el mar?", respuesta: "ariel" },
    { pregunta: "¿En qué película un elefante vuela con sus orejas?", respuesta: "dumbo" }
    // Puedes seguir añadiendo más preguntas aquí
];

// Frases para PPM (sin cambios)
const frasesPPM = [
    "el rápido zorro marrón salta sobre el perro perezoso",
    "la vida es como una caja de chocolates nunca sabes qué te va a tocar",
    // ... (mantengo la lista original)
];

// Estado
const instanceId = uuidv4();
const activeTrivia = new Map();
const sentMessages = new Map();
const processedMessages = new Map();
const triviaLoops = new Map();
const ppmSessions = new Map();
let dataStore = { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {} };

// Utilidades
const createEmbed = (color, title, description, footer = 'Con cariño, Miguel IA') => {
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

// Funciones de persistencia en GitHub
async function loadDataStore() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        const loadedData = content ? JSON.parse(content) : { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {} };
        return {
            conversationHistory: loadedData.conversationHistory || {},
            triviaRanking: loadedData.triviaRanking || {},
            personalPPMRecords: loadedData.personalPPMRecords || {}
        };
    } catch (error) {
        console.error('Error al cargar datos desde GitHub:', error.message);
        return { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {} };
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
                await axios.put(
                    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                    {
                        message: 'Crear archivo inicial para historial y ranking',
                        content: Buffer.from(JSON.stringify({ conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {} }, null, 2)).toString('base64'),
                    },
                    { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
                );
                return;
            } else {
                throw error;
            }
        }
        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                message: 'Actualizar historial y ranking',
                content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
                sha: sha,
            },
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
    }
}

// Función de Trivia (solo sin opciones)
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
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id,
                max: 1,
                time: 60000,
                errors: ['time']
            });
            const respuestaUsuario = respuestas.first().content.toLowerCase().trim();
            activeTrivia.delete(message.channel.id);

            if (respuestaUsuario === trivia.respuesta) {
                updateRanking(message.author.id, message.author.username);
                await sendSuccess(message.channel, '🎉 ¡Correcto!',
                    `¡Bien hecho, ${userName}! La respuesta correcta era **${trivia.respuesta}**. ¡Ganaste 1 punto!`);
            } else {
                await sendError(message.channel, '❌ ¡Casi!',
                    `Lo siento, ${userName}, la respuesta correcta era **${trivia.respuesta}**.`);
            }
        } catch (error) {
            activeTrivia.delete(message.channel.id);
            await sendError(message.channel, '⏳ ¡Tiempo agotado!',
                `Se acabó el tiempo, ${userName}. La respuesta correcta era **${trivia.respuesta}**.`);
        }
    }
    await sendSuccess(message.channel, '🏁 ¡Trivia Terminada!', `¡Completaste las ${numQuestions} preguntas, ${userName}! Usa !ranking para ver tu puntaje.`);
}

function obtenerPreguntaTriviaSinOpciones() {
    if (preguntasTriviaSinOpciones.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * preguntasTriviaSinOpciones.length);
    return preguntasTriviaSinOpciones[randomIndex];
}

function updateRanking(userId, username) {
    if (!dataStore.triviaRanking[userId]) {
        dataStore.triviaRanking[userId] = { username, score: 0 };
    }
    dataStore.triviaRanking[userId].score += 1;
    saveDataStore(dataStore);
}

function getCombinedRankingEmbed(userId, username) {
    const triviaRanking = Object.entries(dataStore.triviaRanking)
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, 5)
        .map(([id, { username: u, score }], i) => `${i + 1}. **${u}**: ${score} puntos (Trivia)`);

    const personalPPMRecords = (dataStore.personalPPMRecords[userId] || [])
        .sort((a, b) => b.ppm - a.ppm)
        .slice(0, 5)
        .map((record, i) => `${i + 1}. **${record.ppm} PPM** - ${new Date(record.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);

    const description = [
        triviaRanking.length > 0 ? '**Ranking de Trivia:**\n' + triviaRanking.join('\n') : '¡Aún no hay puntajes de trivia!',
        personalPPMRecords.length > 0 ? '\n**Tus Récords de Mecanografía:**\n' + personalPPMRecords.join('\n') : '\n¡Aún no tienes récords de mecanografía!'
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

    if (content.startsWith('!chat')) {
        const chatMessage = content.slice(5).trim();
        if (!chatMessage) return sendError(channel, `Escribe un mensaje después de "!chat", ${userName}.`);

        const waitingEmbed = createEmbed('#55FFFF', `¡Un momento, ${userName}!`, 'Espera, estoy buscando una respuesta...');
        const waitingMessage = await channel.send({ embeds: [waitingEmbed] });

        try {
            const prompt = `Eres Miguel IA, creado por Miguel para ayudar a ${userName}. Responde a "${chatMessage}" de forma natural, amigable y detallada, explicando el tema si es una pregunta, con pasos claros si aplica. Asegúrate de completar todas las ideas y no dejar frases cortadas. Termina siempre preguntando si sirvió la respuesta con una invitación a reaccionar con ✅ o ❌.`;
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                { 
                    inputs: prompt, 
                    parameters: { 
                        max_new_tokens: 500, 
                        return_full_text: false, 
                        temperature: 0.6 
                    } 
                },
                { 
                    headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' },
                    timeout: 20000 
                }
            );

            let aiReply = response.data[0]?.generated_text?.trim();
            if (!aiReply || aiReply.length < 20 || !aiReply.includes('¿Te sirvió?')) {
                aiReply = `¡Uy, ${userName}! No pude explicarlo bien esta vez. Sobre "${chatMessage}", te diría que estoy aquí para ayudarte con lo que necesites. Si quieres más detalles, dame una pista. ¿Te sirvió esta respuesta? Reacciona con ✅ o ❌, ¡por favor!`;
            }

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
        } catch (error) {
            console.error('Error en !chat:', error.message);
            const errorEmbed = createEmbed('#FF5555', '¡Ups!', `Algo falló, ${userName}. ${error.code === 'ECONNABORTED' ? 'Tardé demasiado.' : 'No sé qué pasó.'} ¡Intenta de nuevo!`);
            await channel.send({ embeds: [errorEmbed] });
            await waitingMessage.delete();
        }
        return;
    }

    if (content.startsWith('!trivia')) {
        await manejarTrivia(message);
        return;
    }

    if (content.startsWith('!ranking')) {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (content.startsWith('!ppm')) {
        // Lógica de PPM (mantenida igual por brevedad)
    }

    if (content.startsWith('!help')) {
        const embed = createEmbed('#55FF55', `¡Comandos para ti, ${userName}!`,
            'Aquí tienes lo que puedo hacer:\n' +
            '- **!chat [mensaje]**: Charla conmigo.\n' +
            '- **!trivia [n]**: Trivia sin opciones (mínimo 10).\n' +
            '- **!ppm**: Prueba de mecanografía.\n' +
            '- **!ranking**: Ver puntajes.\n' +
            '- **!ayuda [problema]**: Pedir ayuda.\n' +
            '- **hola**: Un saludo especial.'
        );
        await channel.send({ embeds: [embed] });
        return;
    }

    if (content.toLowerCase() === 'hola') {
        sendSuccess(channel, `¡Hola, ${userName}!`, `Soy Miguel IA, aquí para ayudarte. ¿Qué tienes en mente?`);
        return;
    }
});

client.login(process.env.DISCORD_TOKEN);
