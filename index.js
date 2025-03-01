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
const ALLOWED_USER_ID = '1023132788632862761'; // ID de Belén
const CHANNEL_ID = '1343749554905940058';
const MAX_MESSAGES = 20;

const BOT_UPDATES = [
    '¡Arreglé el error sentMessage y ahora puedo mostrar varias imágenes en responder y !ayuda, Todo listo para que funcione perfecto mientras estoy en el quinto sueño.',
    'Espero ahora si este todo bien hecho, he mejorado las respuestas en las que el bot te responderá, espero te pueda servir, estoy pensando en mas mejoras.'
];

const PREVIOUS_BOT_UPDATES = [
    '¡Arreglé el error sentMessage y ahora puedo mostrar varias imágenes en responder y !ayuda, Todo listo para que funcione perfecto mientras estoy en el quinto sueño.',
    'Espero ahora si este todo bien hecho, he mejorado las respuestas en las que el bot te responderá, espero te pueda servir, estoy pensando en mas mejoras.'
];

// Preguntas predefinidas con 4 opciones (incluye tu lista completa aquí)
const preguntasTrivia = [
    { pregunta: "¿Cuál es el mineral más raro en Minecraft 1.8?", respuesta: "esmeralda", incorrectas: ["diamante", "oro", "hierro"] },
    { pregunta: "¿Cuántos bloques de altura tiene un Enderman?", respuesta: "3", incorrectas: ["2", "4", "5"] },
    { pregunta: "¿Qué mob se domesticó primero en Minecraft?", respuesta: "lobo", incorrectas: ["gato", "caballo", "cerdo"] },
    { pregunta: "¿Cuántos ojos de Ender necesitas para activar un portal al End?", respuesta: "12", incorrectas: ["10", "14", "16"] },
    { pregunta: "¿Cómo se llama el creador original de Minecraft?", respuesta: "Notch", incorrectas: ["Herobrine", "Jeb", "Dinnerbone"] },
    { pregunta: "¿Qué animal se puede montar en Minecraft 1.8?", respuesta: "caballo", incorrectas: ["cerdo", "vaca", "oveja"] },
    { pregunta: "¿Qué estructura contiene un portal al End?", respuesta: "fortaleza", incorrectas: ["templo", "aldea", "mina"] },
    { pregunta: "¿Qué item revive al jugador en Minecraft?", respuesta: "tótem de la inmortalidad", incorrectas: ["poción", "manzana dorada", "estrella del Nether"] },
    { pregunta: "¿Cuál es la mejor armadura en Minecraft 1.8?", respuesta: "diamante", incorrectas: ["hierro", "oro", "cuero"] },
    { pregunta: "¿Qué item se usa para obtener lana?", respuesta: "tijeras", incorrectas: ["pala", "hacha", "pico"] },
    { pregunta: "¿Qué bioma puedes encontrar en Minecraft 1.8?", respuesta: "bosque", incorrectas: ["desierto", "montaña", "pantano"] },
    { pregunta: "¿Cuántos tipos de aldeanos hay en Minecraft?", respuesta: "5", incorrectas: ["3", "7", "9"] },
    { pregunta: "¿Cuál es el animal más rápido de Minecraft?", respuesta: "caballo", incorrectas: ["lobo", "ocelote", "cerdo"] },
    { pregunta: "¿Cuántas piezas de obsidiana se necesitan para hacer un portal al Nether?", respuesta: "10", incorrectas: ["8", "12", "14"] },
    { pregunta: "¿Qué mob se añadió en la versión 1.8 de Minecraft?", respuesta: "conejos", incorrectas: ["gallinas", "vacas", "ovejas"] },
    { pregunta: "¿Cuál es la comida que te da más saturación en Minecraft?", respuesta: "estofado de conejo", incorrectas: ["pan", "carne", "manzana"] },
    { pregunta: "¿Cuántos fragmentos de Netherite se necesitan para un lingote?", respuesta: "4", incorrectas: ["2", "3", "5"] },
    { pregunta: "¿Cuál es el único mob que puede flotar en el agua?", respuesta: "pez", incorrectas: ["calamar", "araña", "vaca"] },
    { pregunta: "¿Qué bloque explota al ser golpeado por un rayo?", respuesta: "creeper cargado", incorrectas: ["tierra", "piedra", "madera"] },
    { pregunta: "¿Cuántos corazones tiene el Wither?", respuesta: "150", incorrectas: ["100", "200", "50"] },
    { pregunta: "¿Qué arma dispara flechas en Minecraft?", respuesta: "arco", incorrectas: ["espada", "pico", "hacha"] },
    { pregunta: "¿Qué bloque se usa para hacer un faro?", respuesta: "vidrio", incorrectas: ["madera", "piedra", "arcilla"] },
    { pregunta: "¿Cuál es la capital de Francia?", respuesta: "París", incorrectas: ["Londres", "Madrid", "Berlín"] },
    { pregunta: "¿En qué continente está Brasil?", respuesta: "América del Sur", incorrectas: ["África", "Asia", "Europa"] },
    { pregunta: "¿Quién escribió 'Harry Potter'?", respuesta: "J.K. Rowling", incorrectas: ["Tolkien", "Stephen King", "George R.R. Martin"] },
    { pregunta: "¿Cuál es el océano más grande del mundo?", respuesta: "Pacífico", incorrectas: ["Atlántico", "Índico", "Ártico"] },
    { pregunta: "¿Cuántos planetas hay en el sistema solar?", respuesta: "8", incorrectas: ["7", "9", "10"] },
    { pregunta: "¿Cuál es el animal más grande del planeta?", respuesta: "ballena azul", incorrectas: ["elefante", "tiburón", "jirafa"] },
    { pregunta: "¿Qué planeta es el más cercano al Sol?", respuesta: "Mercurio", incorrectas: ["Venus", "Marte", "Júpiter"] },
    { pregunta: "¿En qué año llegó el hombre a la Luna?", respuesta: "1969", incorrectas: ["1965", "1972", "1960"] },
    { pregunta: "¿Qué gas compone la mayor parte de la atmósfera terrestre?", respuesta: "nitrógeno", incorrectas: ["oxígeno", "dióxido de carbono", "argón"] },
    { pregunta: "¿Cuál es el río más largo del mundo?", respuesta: "Amazonas", incorrectas: ["Nilo", "Misisipi", "Yangtsé"] },
    { pregunta: "¿Qué animal es conocido por su cuello largo?", respuesta: "jirafa", incorrectas: ["elefante", "rinoceronte", "hipopótamo"] },
    { pregunta: "¿Cuántos continentes habitados hay?", respuesta: "6", incorrectas: ["5", "7", "4"] },
    { pregunta: "¿Qué elemento tiene el símbolo 'H'?", respuesta: "hidrógeno", incorrectas: ["helio", "hierro", "oro"] },
    { pregunta: "¿Qué país es conocido como la tierra del sol naciente?", respuesta: "Japón", incorrectas: ["China", "Corea", "Tailandia"] },
    { pregunta: "¿Cuál es el desierto más grande del mundo?", respuesta: "Antártida", incorrectas: ["Sahara", "Gobi", "Atacama"] },
    { pregunta: "¿Qué instrumento mide el tiempo?", respuesta: "reloj", incorrectas: ["termómetro", "barómetro", "compás"] },
    { pregunta: "¿Qué color tiene el cielo en un día despejado?", respuesta: "azul", incorrectas: ["verde", "rojo", "amarillo"] },
    { pregunta: "¿Cuántos días tiene un año bisiesto?", respuesta: "366", incorrectas: ["365", "364", "367"] },
    { pregunta: "¿Qué mamífero vuela?", respuesta: "murciélago", incorrectas: ["ardilla", "ratón", "gato"] },
    { pregunta: "¿Qué fruta es conocida por caer sobre Newton?", respuesta: "manzana", incorrectas: ["pera", "naranja", "plátano"] },
    { pregunta: "¿Cuál es el metal más abundante en la corteza terrestre?", respuesta: "aluminio", incorrectas: ["hierro", "cobre", "oro"] },
    { pregunta: "¿Qué ave no puede volar pero corre rápido?", respuesta: "avestruz", incorrectas: ["pingüino", "ganso", "pavo"] },
    { pregunta: "¿Qué país tiene más población del mundo?", respuesta: "China", incorrectas: ["India", "EE.UU.", "Rusia"] },
    { pregunta: "¿Qué estación sigue al verano?", respuesta: "otoño", incorrectas: ["invierno", "primavera", "verano"] },
    { pregunta: "¿Cuántos lados tiene un triángulo?", respuesta: "3", incorrectas: ["4", "5", "6"] },
    { pregunta: "¿Qué bebida es conocida como H2O?", respuesta: "agua", incorrectas: ["leche", "jugo", "café"] },
    { pregunta: "¿Qué animal es el rey de la selva?", respuesta: "león", incorrectas: ["tigre", "elefante", "jirafa"] },
    { pregunta: "¿Qué idioma se habla en Brasil?", respuesta: "portugués", incorrectas: ["español", "inglés", "francés"] },
    { pregunta: "¿Qué planeta tiene anillos visibles?", respuesta: "Saturno", incorrectas: ["Júpiter", "Marte", "Urano"] },
    { pregunta: "¿Qué inventó Thomas Edison?", respuesta: "bombilla", incorrectas: ["teléfono", "radio", "televisión"] },
    { pregunta: "¿Qué deporte se juega con una raqueta y una pelota pequeña?", respuesta: "tenis", incorrectas: ["fútbol", "básquet", "voleibol"] },
    { pregunta: "¿Qué parte del cuerpo usas para escuchar?", respuesta: "oído", incorrectas: ["ojo", "nariz", "boca"] },
    { pregunta: "¿Qué país es famoso por los tulipanes?", respuesta: "Países Bajos", incorrectas: ["Francia", "Italia", "Alemania"] },
    { pregunta: "¿Cuántos minutos tiene una hora?", respuesta: "60", incorrectas: ["50", "70", "80"] },
];


// Estado
const activeTrivia = new Map();
const sentMessages = new Map();
let dataStore = { conversationHistory: {}, triviaRanking: {} };

// Utilidades
const createEmbed = (color, title, description, footer = 'Con cariño, Miguel IA') => {
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
                await axios.put(
                    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                    {
                        message: 'Crear archivo inicial para historial y ranking',
                        content: Buffer.from(JSON.stringify({ conversationHistory: {}, triviaRanking: {} }, null, 2)).toString('base64'),
                    },
                    { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
                );
                console.log('Archivo creado en GitHub');
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
        console.log('Datos guardados en GitHub');
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
    }
}

// Funciones de trivia y ranking
function obtenerPreguntaTrivia() {
    if (preguntasTrivia.length === 0) {
        console.error('No hay preguntas de trivia definidas.');
        return null;
    }
    const randomIndex = Math.floor(Math.random() * preguntasTrivia.length);
    const trivia = preguntasTrivia[randomIndex];
    const opciones = [...trivia.incorrectas, trivia.respuesta].sort(() => Math.random() - 0.5);
    return { pregunta: trivia.pregunta, opciones, respuesta: trivia.respuesta };
}

async function manejarTrivia(message) {
    const trivia = obtenerPreguntaTrivia();
    if (!trivia) {
        return sendError(message.channel, 'No hay preguntas de trivia disponibles.');
    }
    const embedPregunta = createEmbed('#55FFFF', '🎲 ¡Pregunta de Trivia!',
        `${trivia.pregunta}\n\n${trivia.opciones.map((op, i) => `**${String.fromCharCode(65 + i)})** ${op}`).join('\n')}`,
        'Tienes 15 segundos para responder con A, B, C o D'
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

// Evento ready
client.once('ready', async () => {
    console.log('¡Miguel IA está listo para ayudar!');
    client.user.setPresence({ activities: [{ name: "Listo para ayudarte, Belén", type: 0 }], status: 'online' });

    dataStore = await loadDataStore();

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) throw new Error('Canal no encontrado');

        const userHistory = dataStore.conversationHistory[ALLOWED_USER_ID] || [];
        const historySummary = userHistory.length > 0
            ? userHistory.slice(-3).map(msg => `${msg.role === 'user' ? 'Belén' : 'Yo'}: ${msg.content}`).join('\n')
            : 'No hay historial reciente, Belén.';

        const argentinaTime = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
        const updatesChanged = JSON.stringify(BOT_UPDATES) !== JSON.stringify(PREVIOUS_BOT_UPDATES);

        if (updatesChanged) {
            const updateEmbed = createEmbed('#FFD700', '📢 Actualizaciones de Miguel IA',
                '¡Tengo mejoras nuevas para compartir, Belén!')
                .addFields(
                    { name: 'Novedades', value: BOT_UPDATES.map(update => `- ${update}`).join('\n'), inline: false },
                    { name: 'Hora de actualización', value: `${argentinaTime}`, inline: false },
                    { name: 'Últimas conversaciones', value: historySummary, inline: false }
                );
            await channel.send({ embeds: [updateEmbed] });
            console.log('Actualizaciones enviadas al canal:', CHANNEL_ID);
        } else {
            console.log('No hay cambios en las actualizaciones, no se enviaron.');
        }
    } catch (error) {
        console.error('Error al enviar actualizaciones:', error);
    }
});

// Evento messageCreate
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
                const embeds = [];
                const baseEmbed = createEmbed('#55FF55', '¡Respuesta de Miguel!', `${reply}\nSi necesitas más, usa !ayuda, Belén.`);
                if (message.attachments.size > 0) {
                    const attachmentText = message.attachments.map((a, i) => `Archivo ${i + 1}: ${a.url}`).join('\n');
                    message.attachments.forEach(a => {
                        if (a.contentType?.startsWith('image/')) {
                            const imageEmbed = new EmbedBuilder(baseEmbed.data).setImage(a.url);
                            embeds.push(imageEmbed);
                        }
                    });
                    if (embeds.length === 0) baseEmbed.addFields({ name: 'Archivos', value: attachmentText });
                }
                embeds.push(baseEmbed);
                const sentMessage = await targetUser.send({ embeds });
                sentMessages.set(sentMessage.id, { content: reply, originalQuestion: 'Mensaje enviado con "responder"', timestamp: new Date().toISOString(), message: sentMessage });
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

    if (content.startsWith('!ayuda')) {
        const issue = content.slice(6).trim();
        if (!issue) return sendError(channel, 'Dime qué necesitas después de "!ayuda", Belén.');
        try {
            const owner = await client.users.fetch(OWNER_ID);
            const embeds = [];
            const baseEmbed = createEmbed('#FFD700', '¡Solicitud de ayuda!', `Belén necesita ayuda con: "${issue}"`);
            if (message.attachments.size > 0) {
                const attachmentText = message.attachments.map((a, i) => `Archivo ${i + 1}: ${a.url}`).join('\n');
                message.attachments.forEach(a => {
                    if (a.contentType?.startsWith('image/')) {
                        const imageEmbed = new EmbedBuilder(baseEmbed.data).setImage(a.url);
                        embeds.push(imageEmbed);
                    }
                });
                if (embeds.length === 0) baseEmbed.addFields({ name: 'Adjuntos', value: attachmentText });
            }
            embeds.push(baseEmbed);
            await owner.send({ embeds });
            const twilio = require('twilio');
            const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
            await clientTwilio.calls.create({
                twiml: `<Response><Say voice="alice">¡Despierta Miguel! Belén necesita ayuda con ${issue}.</Say></Response>`,
                to: process.env.MY_PHONE_NUMBER,
                from: process.env.TWILIO_PHONE_NUMBER,
            });
            sendSuccess(channel, '¡Mensaje enviado!', 'Ya avisé a Miguel y lo estoy llamando, Belén.');
        } catch (error) {
            console.error('Error en !ayuda:', error);
            sendError(channel, 'No pude avisar a Miguel, Belén.');
        }
        return;
    }

    if (content.startsWith('!help')) {
        const embed = createEmbed('#55FF55', '¡Aquí tienes mis comandos, Belén!',
            'Estoy listo para ayudarte con:\n' +
            '- **!ayuda <problema>**: Pide ayuda.\n' +
            '- **!help**: Lista de comandos.\n' +
            '- **!trivia**: Juega trivia.\n' +
            '- **!ranking**: Muestra el ranking de trivia.\n' +
            '- **!sugerencias <idea>**: Envía ideas.\n' +
            '- **!chat [mensaje]**: Charla conmigo usando IA.\n' +
            '- **hola**: Saludo especial.'
        );
        await channel.send({ embeds: [embed] });
        return;
    }

    if (content.startsWith('!sugerencias')) {
        const suggestion = content.slice(12).trim();
        if (!suggestion) return sendError(channel, 'Escribe tu sugerencia después de "!sugerencias", Belén.');
        try {
            const owner = await client.users.fetch(OWNER_ID);
            const embed = createEmbed('#FFD700', '💡 Nueva sugerencia de Belén', `Sugerencia: "${suggestion}"`);
            await owner.send({ embeds: [embed] });
            sendSuccess(channel, '¡Sugerencia enviada!', 'Tu idea está con Miguel, Belén. ¡Gracias!');
        } catch (error) {
            console.error('Error en !sugerencias:', error);
            sendError(channel, 'No pude enviar tu sugerencia, Belén.');
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
        const chatMessage = content.slice(5).trim();
        if (!chatMessage) return sendError(channel, 'Escribe un mensaje después de "!chat", por ejemplo: !chat hola, Belén.');

        // Enviar mensaje provisional
        const waitingEmbed = createEmbed('#55FFFF', '¡Un momento, Belén!', 'Espera, estoy buscando una respuesta...');
        const waitingMessage = await channel.send({ embeds: [waitingEmbed] });

        try {
            const prompt = `Eres Miguel IA, un amigo cercano creado por Miguel para Belén. Responde a "${chatMessage}" de Belén de forma natural y amigable, solo charlando, sin sugerir comandos ni ayuda técnica.`;
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                { inputs: prompt, parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.7 } },
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' } }
            );
            let aiReply = response.data[0]?.generated_text?.trim() || '¡Uy, me quedé en blanco, Belén! ¿Qué me cuentas tú?';
            dataStore.conversationHistory[author.id].push({ role: 'assistant', content: aiReply, timestamp: new Date().toISOString() });
            saveDataStore(dataStore);
            const finalEmbed = createEmbed('#55FFFF', '¡Charlando contigo, Belén!', aiReply);
            await waitingMessage.edit({ embeds: [finalEmbed] });
        } catch (error) {
            console.error('Error en !chat:', error);
            const errorEmbed = createEmbed('#FF5555', '¡Ups, Belén!', 'Algo falló al buscar la respuesta, pero sigo aquí.');
            await waitingMessage.edit({ embeds: [errorEmbed] });
        }
        return;
    }

    if (content.toLowerCase() === 'hola') {
        sendSuccess(channel, '¡Hola, qué alegría verte!', `Soy Miguel IA, aquí para ayudarte, Belén. ¿Qué tienes en mente?`);
        return;
    }

    // Si no coincide ningún comando, no responde nada
});

// Evento messageReactionAdd
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id !== ALLOWED_USER_ID || !sentMessages.has(reaction.message.id)) return;

    const messageData = sentMessages.get(reaction.message.id);
    const owner = await client.users.fetch(OWNER_ID);
    const ecuadorTime = new Date(messageData.timestamp).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    const reactionEmbed = createEmbed('#FFD700', '¡Reacción recibida!',
        `Pregunta original: "${messageData.originalQuestion}"\nRespuesta enviada: "${messageData.content}"\nReacción: ${reaction.emoji}\nEnviado el: ${ecuadorTime}`);

    try {
        await owner.send({ embeds: [reactionEmbed] });
        console.log(`Notificación enviada a ${OWNER_ID}: ${reaction.emoji} en mensaje "${messageData.content}"`);
    } catch (error) {
        console.error('Error al notificar reacción:', error);
    }

    if (reaction.emoji.name === '❌' && messageData.originalQuestion !== 'Mensaje enviado con "responder"') {
        try {
            const alternativePrompt = `Eres Miguel IA, creado por Miguel para Belén. Belén no quedó satisfecha con tu respuesta anterior a "${messageData.originalQuestion}": "${messageData.content}". Proporciona una respuesta alternativa, diferente, clara y útil, como un amigo cercano. No repitas la respuesta anterior. Termina con una nota positiva o una sugerencia para seguir charlando.`;
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                { inputs: alternativePrompt, parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.3 } },
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' } }
            );
            let alternativeReply = response.data[0]?.generated_text?.trim() || 'No se me ocurre algo mejor ahora, pero no me rindo, Belén. ¿Qué tal si me das más detalles? ¡Quiero ayudarte bien!';
            const alternativeEmbed = createEmbed('#55FFFF', '¡Probemos otra vez, Belén!', alternativeReply, '¿Mejor ahora? Reacciona con ✅ o ❌');
            const newSentMessage = await messageData.message.channel.send({ embeds: [alternativeEmbed] });
            await newSentMessage.react('✅');
            await newSentMessage.react('❌');
            sentMessages.set(newSentMessage.id, { content: alternativeReply, originalQuestion: messageData.originalQuestion, timestamp: new Date().toISOString(), message: newSentMessage });
        } catch (error) {
            console.error('Error al generar respuesta alternativa:', error);
            sendError(messageData.message.channel, 'No pude encontrar una mejor respuesta ahora, Belén.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
