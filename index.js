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
const HISTORY_FILE = './conversationHistory.json';
const LAST_UPDATES_FILE = './lastUpdates.json';
const MAX_MESSAGES = 20;

// Lista de actualizaciones actuales
const BOT_UPDATES = [
    '¡Arreglé el error sentMessage y ahora puedo mostrar varias imágenes en responder y !ayuda, Todo listo para que funcione perfecto mientras estoy en el quinto sueño.',
    'Espero ahora si este todo bien hecho, he mejorado las respuestas en las que el bot te responderá, espero te pueda servir, estoy pensando en mas mejoras.'
];

// Estado anterior de las actualizaciones (fijo en el código)
const PREVIOUS_BOT_UPDATES = [
    '¡Arreglé el error sentMessage y ahora puedo mostrar varias imágenes en responder y !ayuda, Todo listo para que funcione perfecto mientras estoy en el quinto sueño.',
    'Espero ahora si este todo bien hecho, he mejorado las respuestas en las que el bot te responderá, espero te pueda servir, estoy pensando en mas mejoras.'
];

// Preguntas predefinidas con 4 opciones
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

// Estado de trivia activa
const activeTrivia = new Map();

// Cargar y guardar historial
let conversationHistory;

async function loadConversationHistory() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                },
            }
        );

        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        if (!content.trim()) {
            console.log('El historial en GitHub está vacío, inicializando con valor por defecto.');
            return {};
        }
        return JSON.parse(content);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('Archivo de historial no encontrado en GitHub, inicializando con valor por defecto.');
            return {};
        }
        console.error('Error al cargar el historial desde GitHub:', error.message);
        return {};
    }
}

async function saveConversationHistory(history) {
    try {
        let sha;
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json',
                    },
                }
            );
            sha = response.data.sha;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Archivo no encontrado en GitHub, creando uno nuevo.');
                await axios.put(
                    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                    {
                        message: 'Crear historial de conversación inicial',
                        content: Buffer.from(JSON.stringify(history, null, 2)).toString('base64'),
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github+json',
                        },
                    }
                );
                return;
            } else {
                console.error('Error al obtener SHA:', error.message);
                throw error;
            }
        }

        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                message: 'Actualizar historial de conversación',
                content: Buffer.from(JSON.stringify(history, null, 2)).toString('base64'),
                sha: sha,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                },
            }
        );
        console.log('Historial guardado en GitHub');
    } catch (error) {
        console.error('Error al guardar el historial en GitHub:', error.message);
    }
}

// Cargar y guardar últimas actualizaciones
function loadLastUpdates() {
    try {
        if (fs.existsSync(LAST_UPDATES_FILE)) {
            const data = fs.readFileSync(LAST_UPDATES_FILE, 'utf8');
            if (!data.trim()) {
                console.log('Últimas actualizaciones vacías, inicializando con valores por defecto.');
                return { timestamp: 0, updates: [] };
            }
            return JSON.parse(data);
        }
        console.log('Archivo de últimas actualizaciones no encontrado, inicializando con valores por defecto.');
        return { timestamp: 0, updates: [] };
    } catch (error) {
        console.error('Error al cargar las últimas actualizaciones:', error.message);
        return { timestamp: 0, updates: [] };
    }
}

function saveLastUpdates(updates, timestamp) {
    try {
        fs.writeFileSync(LAST_UPDATES_FILE, JSON.stringify({ timestamp, updates }, null, 2), 'utf8');
        console.log('Últimas actualizaciones guardadas en', LAST_UPDATES_FILE);
    } catch (error) {
        console.error('Error al guardar las últimas actualizaciones:', error);
    }
}

function obtenerPreguntaTrivia() {
    const randomIndex = Math.floor(Math.random() * preguntasTrivia.length);
    const trivia = preguntasTrivia[randomIndex];
    const opciones = [...trivia.incorrectas, trivia.respuesta].sort(() => Math.random() - 0.5);
    return { pregunta: trivia.pregunta, opciones, respuesta: trivia.respuesta };
}

async function manejarTrivia(message) {
    const trivia = obtenerPreguntaTrivia();

    const embedPregunta = new EmbedBuilder()
        .setColor('#55FFFF')
        .setTitle('🎲 ¡Pregunta de Trivia!')
        .setDescription(`${trivia.pregunta}\n\n` +
            trivia.opciones.map((opcion, i) => `**${String.fromCharCode(65 + i)})** ${opcion}`).join('\n'))
        .setFooter({ text: 'Tienes 15 segundos para responder con A, B, C o D | Miguel IA' })
        .setTimestamp();

    const sentMessage = await message.channel.send({ embeds: [embedPregunta] });
    const triviaId = sentMessage.id;

    activeTrivia.set(message.channel.id, {
        id: triviaId,
        correcta: trivia.respuesta,
        opciones: trivia.opciones
    });

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
            const embedCorrecto = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('🎉 ¡Correcto!')
                .setDescription(`¡Bien hecho, ${message.author.tag}! La respuesta correcta era **${trivia.respuesta}**.`)
                .setFooter({ text: '¿Otra ronda? Usa !trivia | Miguel IA' })
                .setTimestamp();
            return message.channel.send({ embeds: [embedCorrecto] });
        } else {
            const embedIncorrecto = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('❌ ¡Casi!')
                .setDescription(`Lo siento, ${message.author.tag}, la respuesta correcta era **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}).`)
                .setFooter({ text: '¡Intenta otra vez con !trivia! | Miguel IA' })
                .setTimestamp();
            return message.channel.send({ embeds: [embedIncorrecto] });
        }
    } catch (error) {
        activeTrivia.delete(message.channel.id);
        const embedTiempo = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('⏳ ¡Tiempo agotado!')
            .setDescription(`Se acabó el tiempo. La respuesta correcta era **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}). ¿Otra ronda? Usa !trivia.`)
            .setFooter({ text: 'Miguel IA' })
            .setTimestamp();
        return message.channel.send({ embeds: [embedTiempo] });
    }
}

client.once('ready', async () => {
    console.log('¡Miguel IA está listo para ayudar!');
    client.user.setPresence({ 
        activities: [{ name: "Listo para ayudarte, usa !ayuda o !help si necesitas algo", type: 0 }], 
        status: 'online' 
    });

    conversationHistory = await loadConversationHistory();

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) throw new Error('Canal no encontrado');

        const userHistory = conversationHistory[ALLOWED_USER_ID] || [];
        const historySummary = userHistory.length > 0
            ? userHistory.slice(-3).map(msg => `${msg.role === 'user' ? 'Usuario' : 'Yo'}: ${msg.content}`).join('\n')
            : 'No hay historial reciente.';

        const argentinaTime = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

        const updatesChanged = JSON.stringify(BOT_UPDATES) !== JSON.stringify(PREVIOUS_BOT_UPDATES);

        if (updatesChanged) {
            const updateEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('📢 Actualizaciones de Miguel IA')
                .setDescription('¡Tengo mejoras nuevas para compartir!')
                .addFields(
                    { name: 'Novedades', value: BOT_UPDATES.map(update => `- ${update}`).join('\n'), inline: false },
                    { name: 'Hora de actualización', value: `${argentinaTime}`, inline: false },
                    { name: 'Últimas conversaciones', value: historySummary, inline: false }
                )
                .setFooter({ text: 'Miguel IA' })
                .setTimestamp();

            await channel.send({ embeds: [updateEmbed] });
            console.log('Actualizaciones enviadas al canal:', CHANNEL_ID);
        } else {
            console.log('No hay cambios en las actualizaciones, no se enviaron.');
        }
    } catch (error) {
        console.error('Error al enviar actualizaciones:', error);
    }
});

// Mapa para rastrear mensajes enviados
const sentMessages = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    console.log('Mensaje recibido - Autor:', message.author.id, 'Contenido:', message.content, 'Es DM:', !message.guild);

    if (message.author.id !== ALLOWED_USER_ID && message.author.id !== OWNER_ID) {
        console.log('Mensaje ignorado - ID no permitido:', message.author.id);
        return;
    }

    if (message.author.id === ALLOWED_USER_ID) {
        const userId = message.author.id;
        let userHistory = conversationHistory[userId] || [];
        userHistory.push({
            role: 'user',
            content: message.content,
            timestamp: new Date().toISOString()
        });
        if (userHistory.length > MAX_MESSAGES) userHistory.shift();
        conversationHistory[userId] = userHistory;
        saveConversationHistory(conversationHistory);
    }

    if (message.author.id === OWNER_ID && message.content.startsWith('responder')) {
        const reply = message.content.slice(9).trim();
        if (!reply) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('Por favor, escribe algo después de "responder" para enviar.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        let targetUser;
        try {
            targetUser = await client.users.fetch(ALLOWED_USER_ID);
            console.log('Usuario ALLOWED_USER_ID obtenido:', targetUser.tag);
        } catch (error) {
            console.error('Error al obtener el usuario:', error);
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude encontrar al usuario. ¿Está bien el ID o me bloqueó?')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const embeds = [];
        const baseEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Respuesta de Miguel!')
            .setDescription(`Aquí tienes: "${reply}"\nSi necesitas más, usa !ayuda para pedírmelo.`)
            .setFooter({ text: 'Miguel IA' })
            .setTimestamp();

        if (message.attachments.size > 0) {
            const attachments = message.attachments.map(attachment => attachment.url);
            let attachmentText = '';

            message.attachments.forEach((attachment, index) => {
                if (attachment.contentType?.startsWith('image/')) {
                    const imageEmbed = new EmbedBuilder(baseEmbed.data);
                    imageEmbed.setImage(attachment.url);
                    embeds.push(imageEmbed);
                }
                attachmentText += `Archivo ${index + 1}: ${attachment.url}\n`;
            });

            if (embeds.length === 0) {
                baseEmbed.addFields({ name: 'Archivos de Miguel', value: attachmentText || 'Sin enlaces.', inline: false });
                embeds.push(baseEmbed);
            }
        } else {
            embeds.push(baseEmbed);
        }

        try {
            const sentMessage = await targetUser.send({ embeds: embeds });
            sentMessages.set(sentMessage.id, {
                content: reply,
                originalQuestion: 'Mensaje enviado con "responder"',
                timestamp: new Date().toISOString(),
                message: sentMessage
            });
            console.log('Mensaje enviado a ALLOWED_USER_ID:', reply);
            const ownerEmbed = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('¡Éxito!')
                .setDescription('Respuesta enviada con éxito.')
                .setTimestamp();
            await message.reply({ embeds: [ownerEmbed] });
        } catch (error) {
            console.error('Error al enviar respuesta:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude enviar el mensaje. ¿Hay un problema con Discord?')
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed] });
        }
        return;
    }

    if (message.author.id === OWNER_ID && message.content.startsWith('!update')) {
        const updateText = message.content.slice(7).trim();
        if (!updateText) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('Por favor, escribe las actualizaciones después de "!update".')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Error!')
                .setDescription('No encontré el canal para enviar las actualizaciones.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const updateEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📢 Actualización de Miguel IA')
            .setDescription(updateText)
            .setFooter({ text: 'Miguel IA' })
            .setTimestamp();

        try {
            await channel.send({ embeds: [updateEmbed] });
            const successEmbed = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('¡Éxito!')
                .setDescription('Actualización enviada al canal con éxito.')
                .setTimestamp();
            await message.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error al enviar actualización:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude enviar la actualización al canal.')
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed] });
        }
        return;
    }

    if (message.author.id !== ALLOWED_USER_ID) return;

    const isChannelMode = CHANNEL_ID && message.channel.id === CHANNEL_ID;
    const isDMMode = !message.guild;
    if (!isChannelMode && !isDMMode) {
        console.log('Mensaje ignorado - Canal no permitido:', message.channel.id);
        return;
    }

    const userMessage = message.content;

    const twilio = require('twilio');
    const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

if (userMessage.startsWith('!ayuda')) {
    const issue = userMessage.slice(6).trim();
    if (!issue) {
        const embed = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('¡Un momento!')
            .setDescription('Dime qué necesitas después de "!ayuda" y te ayudaré.')
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    console.log(`[AYUDA] Procesando solicitud de ayuda con problema: "${issue}" desde ${message.author.id}`);

    const owner = await client.users.fetch(OWNER_ID);
    const embeds = [];
    const baseEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('¡Solicitud de ayuda!')
        .setDescription(`Se necesita ayuda con: "${issue}"`)
        .setTimestamp();

    if (message.attachments.size > 0) {
        const attachments = message.attachments.map(attachment => attachment.url);
        let attachmentText = '';
        message.attachments.forEach((attachment, index) => {
            if (attachment.contentType?.startsWith('image/')) {
                const imageEmbed = new EmbedBuilder(baseEmbed.data);
                imageEmbed.setImage(attachment.url);
                embeds.push(imageEmbed);
            }
            attachmentText += `Archivo ${index + 1}: ${attachment.url}\n`;
        });
        if (embeds.length === 0) {
            baseEmbed.addFields({ name: 'Adjuntos', value: attachmentText || 'Sin enlaces.', inline: false });
            embeds.push(baseEmbed);
        }
    } else {
        embeds.push(baseEmbed);
    }

    let ownerSuccess = false;
    try {
        await owner.send({ embeds: embeds }); // Corrección: embeds sin array extra
        console.log(`[AYUDA] Mensaje de ayuda enviado exitosamente a OWNER_ID: ${OWNER_ID}`);
        ownerSuccess = true;
    } catch (error) {
        console.error(`[AYUDA] Error al enviar mensaje a OWNER_ID (${OWNER_ID}):`, error.message);
    }

    let twilioSuccess = false;
    try {
        const twilio = require('twilio');
        const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        await clientTwilio.calls.create({
            twiml: `<Response><Say voice="alice">¡Despierta Miguel! Hay una solicitud de ayuda con ${issue}. ¡Vamos, contesta!</Say><Pause length="2"/><Say voice="alice">Repito, ayuda con ${issue}.</Say></Response>`,
            to: process.env.MY_PHONE_NUMBER,
            from: process.env.TWILIO_PHONE_NUMBER,
        });
        console.log('[AYUDA] Llamada Twilio iniciada con éxito');
        twilioSuccess = true;
    } catch (error) {
        console.error('[AYUDA] Error al hacer la llamada Twilio:', error.message);
    }

    const userEmbed = new EmbedBuilder()
        .setColor('#55FFFF')
        .setTitle('¡Mensaje enviado!')
        .setDescription(
            ownerSuccess 
                ? 'Ya le avisé a Miguel' + (twilioSuccess ? ', ¡y estoy llamándolo para que te ayude!' : ', pero no pude llamarlo.')
                : 'No pude avisarle a Miguel directamente, pero estoy trabajando en ello.' + (twilioSuccess ? ' ¡Lo estoy llamando!' : '')
        )
        .setFooter({ text: 'Miguel IA' })
        .setTimestamp();
    
    try {
        await message.reply({ embeds: [userEmbed] });
        console.log(`[AYUDA] Respuesta enviada al usuario ${message.author.id}`);
    } catch (error) {
        console.error('[AYUDA] Error al responder al usuario:', error.message);
    }
}
    if (userMessage.startsWith('!help')) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Aquí tienes mis comandos!')
            .setDescription('Estoy listo para ayudarte con estas opciones:')
            .addFields(
                { name: '!ayuda <problema>', value: 'Pídele ayuda a Miguel con un mensaje o imagen.' },
                { name: '!help', value: 'Muestra esta lista de comandos.' },
                { name: '!trivia', value: 'Juega trivia con preguntas variadas de Minecraft y más.' },
                { name: '!sugerencias <idea>', value: 'Envía ideas para mejorar el bot a Miguel.' },
                { name: 'hola', value: 'Te doy una bienvenida especial.' },
                { name: 'Cualquier mensaje', value: 'Chatea conmigo, ¡siempre tengo algo útil o divertido que decir!' }
            )
            .setFooter({ text: 'Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [helpEmbed] });
    }

    if (userMessage.startsWith('!sugerencias')) {
        const suggestion = userMessage.slice(12).trim();
        if (!suggestion) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Un momento!')
                .setDescription('Escribe tu sugerencia después de "!sugerencias". ¡Quiero escuchar tus ideas!')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const owner = await client.users.fetch(OWNER_ID);
        const ownerEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💡 Nueva sugerencia')
            .setDescription(`Sugerencia: "${suggestion}"`)
            .setTimestamp();

        try {
            await owner.send({ embeds: [ownerEmbed] });
            const userEmbed = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('¡Sugerencia enviada!')
                .setDescription('Tu idea ya está con Miguel. ¡Gracias por ayudarme a mejorar!')
                .setFooter({ text: 'Miguel IA' })
                .setTimestamp();
            return message.reply({ embeds: [userEmbed] });
        } catch (error) {
            console.error('Error al enviar sugerencia:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude enviar tu sugerencia. ¿Intentamos de nuevo o usas "!ayuda"?')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    }

    if (userMessage.startsWith('!trivia')) {
        console.log('Trivia activada por:', message.author.tag);
        await manejarTrivia(message);
        return;
    }

    if (userMessage.toLowerCase() === 'hola') {
        const embed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Hola, qué alegría verte!')
            .setDescription('Soy Miguel IA, creado por Miguel para ayudarte. Puedo charlar, ayudarte o jugar trivia. Usa "!ayuda" o "!sugerencias" si quieres. ¿Qué tienes en mente?')
            .setFooter({ text: 'Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    const initialEmbed = new EmbedBuilder()
        .setColor('#55FF55')
        .setTitle('¡Hola, soy Miguel IA!')
        .setDescription('Estoy pensando en cómo ayudarte, ¡un segundo! 😊')
        .setFooter({ text: 'Miguel IA' })
        .setTimestamp();

    const sentMessage = await message.reply({ embeds: [initialEmbed] });

    const userHistory = conversationHistory[ALLOWED_USER_ID] || [];
    const historyText = userHistory.map(msg => `${msg.role === 'user' ? 'Tú' : 'Yo'}: ${msg.content}`).join('\n');

    const prompt = `Eres Miguel IA, creado por Miguel. Tu misión es ayudar con inteligencia y paciencia. Responde SOLO a lo que se preguntó en este mensaje, de manera clara, útil y proactiva, como un amigo cercano. No inventes preguntas o respuestas adicionales. Si pregunta cómo hacer algo, da pasos prácticos y simples. Si no está claro, pide más detalles. No uses prefijos como "con:" o "con"; responde directamente con un mensaje natural. Siempre termina con una nota positiva o una sugerencia para seguir charlando. El mensaje fue: ${userMessage}\nTu respuesta:`;

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
            {
                inputs: prompt,
                parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.3 },
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Respuesta cruda de la API:', response.data);

        let aiReply = response.data[0]?.generated_text || '';
        aiReply = aiReply.split('\n').filter(line => !line.toLowerCase().startsWith('milagros:') && !line.toLowerCase().startsWith('tú:')).join('\n').trim();
        if (!aiReply || aiReply.trim().length < 10) {
            aiReply = 'No estoy seguro de cómo ayudarte con eso, pero quiero hacerlo. ¿Puedes darme más detalles? Mientras tanto, ¿te gustaría jugar una trivia con "!trivia" o compartir una idea con "!sugerencias"?';
        }

        let updatedHistory = conversationHistory[ALLOWED_USER_ID] || [];
        updatedHistory.push({
            role: 'assistant',
            content: aiReply,
            timestamp: new Date().toISOString()
        });
        if (updatedHistory.length > MAX_MESSAGES) updatedHistory.shift();
        conversationHistory[ALLOWED_USER_ID] = updatedHistory;
        saveConversationHistory(conversationHistory);

        const finalEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Aquí estoy para ti!')
            .setDescription(aiReply)
            .setFooter({ text: '¿Te sirvió? Reacciona con ✅ o ❌ • Miguel IA' })
            .setTimestamp();

        await sentMessage.edit({ embeds: [finalEmbed] });
        await sentMessage.react('✅');
        await sentMessage.react('❌');

        sentMessages.set(sentMessage.id, {
            content: aiReply,
            originalQuestion: userMessage,
            timestamp: new Date().toISOString(),
            message: sentMessage
        });

    } catch (error) {
        console.error('Error al consultar la API:', error.message, error.response?.data || '');
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('¡Ay, algo no salió bien!')
            .setDescription('No pude encontrar la respuesta perfecta esta vez, pero no te preocupes, estoy aquí. ¿Quieres usar "!ayuda" para que Miguel me eche una mano, o prefieres intentar con otra pregunta?')
            .setFooter({ text: 'Miguel IA' })
            .setTimestamp();
        await sentMessage.edit({ embeds: [errorEmbed] });
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id !== ALLOWED_USER_ID) return;
    if (!sentMessages.has(reaction.message.id)) return;

    const messageData = sentMessages.get(reaction.message.id);
    const owner = await client.users.fetch(OWNER_ID);

    const ecuadorTime = new Date(messageData.timestamp).toLocaleString('es-EC', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });

    const reactionEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('¡Reacción recibida!')
        .setDescription(`Pregunta original: "${messageData.originalQuestion}"\n` +
                        `Respuesta enviada: "${messageData.content}"\n` +
                        `Reacción: ${reaction.emoji}\n` +
                        `Enviado el: ${ecuadorTime}`)
        .setTimestamp();

    try {
        await owner.send({ embeds: [reactionEmbed] });
        console.log(`Notificación enviada a ${OWNER_ID}: ${reaction.emoji} en mensaje "${messageData.content}"`);
    } catch (error) {
        console.error('Error al notificar reacción al dueño:', error);
    }

    // Solo para respuestas normales (no "responder"), manejar ❌
    if (reaction.emoji.name === '❌' && messageData.originalQuestion !== 'Mensaje enviado con "responder"') {
        const alternativePrompt = `Eres Miguel IA, creado por Miguel. La usuaria no quedó satisfecha con tu respuesta anterior a "${messageData.originalQuestion}": "${messageData.content}". Proporciona una respuesta alternativa, diferente, clara y útil, como un amigo cercano. No repitas la respuesta anterior. Termina con una nota positiva o una sugerencia para seguir charlando.\nTu respuesta:`;

        try {
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                {
                    inputs: alternativePrompt,
                    parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.3 },
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            let alternativeReply = response.data[0]?.generated_text || '';
            alternativeReply = alternativeReply.trim();
            if (!alternativeReply || alternativeReply.length < 10) {
                alternativeReply = 'No se me ocurre algo mejor ahora, pero no me rindo. ¿Qué tal si me das más detalles? ¡Quiero ayudarte bien!';
            }

            const alternativeEmbed = new EmbedBuilder()
                .setColor('#55FFFF')
                .setTitle('¡Probemos otra vez!')
                .setDescription(alternativeReply)
                .setFooter({ text: '¿Mejor ahora? Reacciona con ✅ o ❌ • Miguel IA' })
                .setTimestamp();

            const newSentMessage = await messageData.message.channel.send({ embeds: [alternativeEmbed] });
            await newSentMessage.react('✅');
            await newSentMessage.react('❌');

            sentMessages.set(newSentMessage.id, {
                content: alternativeReply,
                originalQuestion: messageData.originalQuestion,
                timestamp: new Date().toISOString(),
                message: newSentMessage
            });

        } catch (error) {
            console.error('Error al generar respuesta alternativa:', error.message);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude encontrar una mejor respuesta ahora. ¿Quieres darme más detalles o usar "!ayuda"?')
                .setFooter({ text: 'Miguel IA' })
                .setTimestamp();
            await messageData.message.channel.send({ embeds: [errorEmbed] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
