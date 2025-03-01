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

// Frases para la prueba de mecanografía (máximo 20 palabras)
const frasesPPM = [
    "El rápido zorro marrón salta sobre el perro perezoso",
    "La vida es como una caja de chocolates nunca sabes qué te va a tocar",
    "Un pequeño paso para el hombre un gran salto para la humanidad",
    "El sol brilla más fuerte cuando estás feliz y rodeado de amigos",
    "La práctica hace al maestro no lo olvides nunca en tu camino",
    "El viento sopla suavemente entre los árboles altos del bosque verde",
    "La perseverancia y el esfuerzo siempre llevan a grandes logros personales",
    "Un día claro con un cielo azul inspira a todos a soñar",
    "El río fluye tranquilo mientras las aves cantan al amanecer cada día",
    "La amistad verdadera se construye con confianza y apoyo mutuo siempre",
    "La lluvia cae suavemente sobre las flores del jardín en primavera",
    "El camino hacia el éxito requiere paciencia y trabajo constante",
    "Las estrellas brillan con intensidad en una noche sin luna",
    "Un libro abierto revela historias de aventura y misterio por descubrir",
    "El mar susurra secretos mientras las olas chocan contra la orilla",
    "La música llena el aire con melodías que alegran el corazón",
    "Un viaje largo comienza con un pequeño paso decidido y firme",
    "Las montañas se alzan majestuosas bajo un cielo despejado y brillante",
    "El fuego crepita cálido en la chimenea durante una noche fría",
    "La esperanza florece en el corazón de quien nunca se rinde",
    "Los niños ríen mientras juegan en el parque bajo el sol",
    "Un sueño puede convertirse en realidad con esfuerzo y dedicación",
    "El bosque guarda secretos antiguos entre sus árboles centenarios",
    "La luz de la luna ilumina el camino en la oscuridad",
    "Un amigo verdadero está siempre listo para brindar apoyo en todo",
    "El tiempo pasa rápido cuando estás disfrutando de la vida",
    "Las flores silvestres crecen libres en los campos abiertos y verdes",
    "Un héroe surge de la adversidad con valentía y honor",
    "El viento lleva consigo los sonidos de la naturaleza al amanecer",
    "La paz se encuentra en los momentos de silencio y reflexión",
    "Un río serpenteante corta a través de las tierras salvajes",
    "Las aves regresan al nido al final del día",
    "La fuerza interior ayuda a superar los desafíos más difíciles",
    "Un amanecer dorado anuncia un nuevo comienzo lleno de esperanza",
    "El arte captura la belleza del mundo en cada pincelada",
    "La nieve cubre el paisaje como un manto blanco y suave",
    "Un viaje en tren ofrece vistas increíbles de la naturaleza",
    "La risa de los niños llena el aire con alegría pura",
    "El desierto guarda tesoros ocultos bajo su arena dorada",
    "Un corazón valiente nunca se rinde ante la adversidad",
    "Las olas del mar traen consigo el sonido de la libertad",
    "Un bosque antiguo susurra historias de tiempos olvidados",
    "La curiosidad lleva a descubrir maravillas escondidas en el mundo",
    "El sol se pone pintando el cielo con colores vibrantes",
    "Un amigo leal permanece a tu lado en los peores momentos",
    "La danza de las hojas cae suavemente en otoño",
    "Un río cristalino refleja las montañas en su superficie",
    "La sabiduría se gana con la experiencia de los años",
    "El canto de los pájaros despierta la mañana con energía",
].filter(frase => frase.split(' ').length <= 20);

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
        .setDescription(description)
        .setFooter({ text: footer })
        .setTimestamp();
};

const sendError = async (channel, message, suggestion = '¿Intentamos de nuevo, Belén?') => {
    const embed = createEmbed('#FF5555', '¡Ups, Belén!', `${message}\n${suggestion}`);
    await channel.send({ embeds: [embed] });
};

const sendSuccess = async (channel, title, message) => {
    const embed = createEmbed('#55FF55', title, message);
    await channel.send({ embeds: [embed] });
};

// Función para limpiar puntuación y normalizar texto
function cleanText(text) {
    // Eliminar puntuación y convertir a minúsculas
    return text.replace(/[.,!?]/g, '').toLowerCase().trim();
}

// Función para comparar texto con tolerancia a errores tipográficos simples
function areSimilar(text1, text2) {
    const cleanText1 = cleanText(text1);
    const cleanText2 = cleanText(text2);
    const words1 = cleanText1.split(' ');
    const words2 = cleanText2.split(' ');

    if (words1.length !== words2.length) return false;

    for (let i = 0; i < words1.length; i++) {
        if (words1[i].length > 3 && words2[i].length > 3) {
            // Para palabras largas (>3 letras), tolerar 1 error tipográfico
            const diff = levenshteinDistance(words1[i], words2[i]);
            if (diff > 1) return false; // Máximo 1 diferencia permitida
        } else if (words1[i] !== words2[i]) {
            return false; // Para palabras cortas, deben ser exactas
        }
    }
    return true;
}

// Algoritmo básico de Levenshtein (distancia de edición)
function levenshteinDistance(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // eliminación
                matrix[i][j - 1] + 1, // inserción
                matrix[i - 1][j - 1] + cost // sustitución
            );
        }
    }
    return matrix[a.length][b.length];
}

// Funciones de persistencia en GitHub
async function loadDataStore() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        return content ? JSON.parse(content) : { conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {} };
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
                console.log('Archivo no encontrado en GitHub, creando uno nuevo.');
                await axios.put(
                    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                    {
                        message: 'Crear archivo inicial para historial y ranking',
                        content: Buffer.from(JSON.stringify({ conversationHistory: {}, triviaRanking: {}, personalPPMRecords: {} }, null, 2)).toString('base64'),
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

async function manejarTrivia(message, isLoop = false) {
    if (!isLoop && activeTrivia.has(message.channel.id)) {
        const triviaData = activeTrivia.get(message.channel.id);
        if (Date.now() - triviaData.timestamp < 1000) {
            console.log(`Instancia ${instanceId} ignoró !trivia duplicado en canal ${message.channel.id}`);
            return;
        }
    }

    const trivia = obtenerPreguntaTrivia();
    if (!trivia) {
        return sendError(message.channel, 'No hay preguntas de trivia disponibles.');
    }
    const embedPregunta = createEmbed('#55FFFF', '🎲 ¡Pregunta de Trivia!',
        `${trivia.pregunta}\n\n${trivia.opciones.map((op, i) => `**${String.fromCharCode(65 + i)})** ${op}`).join('\n')}`,
        'Tienes 15 segundos para responder con A, B, C o D'
    );
    const sentMessage = await message.channel.send({ embeds: [embedPregunta] });
    activeTrivia.set(message.channel.id, { id: sentMessage.id, correcta: trivia.respuesta, opciones: trivia.opciones, timestamp: Date.now(), userId: message.author.id });

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
            await sendSuccess(message.channel, '🎉 ¡Correcto!',
                `¡Bien hecho, ${message.author.tag}! La respuesta correcta era **${trivia.respuesta}**. ¡Ganaste 1 punto!`);
        } else {
            await sendError(message.channel, '❌ ¡Casi!',
                `Lo siento, ${message.author.tag}, la respuesta correcta era **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}).`);
        }

        if (triviaLoops.has(message.author.id) && triviaLoops.get(message.author.id)) {
            await manejarTrivia(message, true);
        }
    } catch (error) {
        activeTrivia.delete(message.channel.id);
        await sendError(message.channel, '⏳ ¡Tiempo agotado!',
            `Se acabó el tiempo. La respuesta correcta era **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}).`);

        if (triviaLoops.has(message.author.id) && triviaLoops.get(message.author.id)) {
            await manejarTrivia(message, true);
        }
    }
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
        .map((record, i) => `${i + 1}. **${record.ppm} PPM** - ${new Date(record.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} (Mecanografía)`);

    const description = [
        triviaRanking.length > 0 ? '**Ranking de Trivia:**\n' + triviaRanking.join('\n') : '¡Aún no hay puntajes de trivia!',
        personalPPMRecords.length > 0 ? '\n**Tus Récords de Mecanografía:**\n' + personalPPMRecords.join('\n') : '\n¡Aún no tienes récords de mecanografía, Belén! Usa !ppm pls para empezar.'
    ].join('\n');

    return createEmbed('#FFD700', '🏆 Ranking Combinado', description);
}

// Función de mecanografía (PPM) con cuenta regresiva y nueva frase al equivocarse
async function manejarPPM(message) {
    if (ppmSessions.has(message.author.id)) {
        return sendError(message.channel, 'Ya tienes una prueba de mecanografía activa, Belén. Termina la actual primero.');
    }

    async function startNewTest() {
        // Cuenta regresiva de 3 segundos
        for (let i = 3; i > 0; i--) {
            await message.channel.send(createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Preparada, Belén! Empieza en ${i}...`));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        await message.channel.send(createEmbed('#00FF00', '🚀 ¡Ya!', '¡Adelante, Belén!'));

        const frase = frasesPPM[Math.floor(Math.random() * frasesPPM.length)];
        const startTime = Date.now();
        const embed = createEmbed('#55FFFF', '📝 Prueba de Mecanografía',
            `Escribe esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTienes 60 segundos para responder.`);
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

            // Actualizar récords personales
            if (!dataStore.personalPPMRecords[message.author.id]) {
                dataStore.personalPPMRecords[message.author.id] = [];
            }
            const newRecord = { ppm, timestamp: new Date().toISOString() };
            dataStore.personalPPMRecords[message.author.id].push(newRecord);
            saveDataStore(dataStore);

            if (areSimilar(respuestaUsuario, frase)) {
                sendSuccess(message.channel, '🎉 ¡Perfecto!',
                    `¡Bien hecho, ${message.author.tag}! Escribiste la frase correctamente en ${tiempoSegundos.toFixed(2)} segundos.\nTu velocidad: **${ppm} PPM**. Usa !ranking para ver tus récords.`);
            } else {
                await sendError(message.channel, '❌ ¡Casi!',
                    `Lo siento, ${message.author.tag}, no escribiste la frase correctamente. ¡Intenta de nuevo!`);
                await startNewTest(); // Iniciar una nueva prueba al equivocarse
            }
        } catch (error) {
            ppmSessions.delete(message.author.id);
            await sendError(message.channel, '⏳ ¡Tiempo agotado!',
                `Se acabó el tiempo. La frase era: **${frase}**. Usa !ppm pls para intentarlo de nuevo, Belén.`);
        }
    }

    await startNewTest();
}

// Evento ready
client.once('ready', async () => {
    console.log(`¡Miguel IA está listo para ayudar! Instancia: ${instanceId}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudarte, Milagros", type: 0 }], status: 'online' });

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

    console.log(`Mensaje recibido - Instancia: ${instanceId}, Autor: ${author.id}, Contenido: ${content}, Es DM: ${isDM}`);

    if (processedMessages.has(message.id)) {
        const processedTime = processedMessages.get(message.id);
        if (Date.now() - processedTime < 1000) {
            console.log(`Instancia ${instanceId} ignoró mensaje duplicado: ${message.id}`);
            return;
        }
    }
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

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
            '- **!trivia**: Inicia trivias continuas.\n' +
            '- **!parar**: Detiene las trivias.\n' +
            '- **!ranking**: Muestra el ranking de trivia y tus récords de mecanografía.\n' +
            '- **!sugerencias <idea>**: Envía ideas.\n' +
            '- **!chat [mensaje]**: Charla conmigo.\n' +
            '- **!ppm**: Inicia prueba de mecanografía con cuenta regresiva.\n' +
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
        triviaLoops.set(author.id, true);
        await manejarTrivia(message);
        return;
    }

    if (content.startsWith('!parar')) {
        if (triviaLoops.has(author.id)) {
            triviaLoops.set(author.id, false);
            activeTrivia.delete(channel.id);
            sendSuccess(channel, '🛑 ¡Trivia detenida!', 'He parado las trivias, Belén. Usa !trivia para empezar de nuevo.');
        } else {
            sendError(channel, 'No hay trivias activas', 'No estás jugando ahora, Belén. Usa !trivia para empezar.');
        }
        return;
    }

    if (content.startsWith('!ranking')) {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
        return;
    }

    if (content.startsWith('!chat')) {
        const chatMessage = content.slice(5).trim();
        if (!chatMessage) return sendError(channel, 'Escribe un mensaje después de "!chat", por ejemplo: !chat hola, Belén.');

        const waitingEmbed = createEmbed('#55FFFF', '¡Un momento, Belén!', 'Espera, estoy buscando una respuesta...');
        const waitingMessage = await channel.send({ embeds: [waitingEmbed] });

        try {
            const prompt = `Eres Miguel IA, un amigo cercano creado por Miguel para Belén. Responde a "${chatMessage}" de Belén de forma natural y amigable, solo charlando, sin sugerir comandos ni ayuda técnica.`;
            console.log('Enviando solicitud a Hugging Face con prompt:', prompt);
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                { inputs: prompt, parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.7 } },
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'application/json' } }
            );
            console.log('Respuesta de Hugging Face:', response.data);
            let aiReply = response.data[0]?.generated_text?.trim();
            if (!aiReply || aiReply.length < 5) {
                aiReply = '¡Uy, me quedé en blanco, Belén! ¿Qué me cuentas tú?';
            }
            dataStore.conversationHistory[author.id].push({ role: 'assistant', content: aiReply, timestamp: new Date().toISOString() });
            saveDataStore(dataStore);
            const finalEmbed = createEmbed('#55FFFF', '¡Charlando contigo, Belén!', aiReply);
            await waitingMessage.edit({ embeds: [finalEmbed] });
        } catch (error) {
            console.error('Error en !chat:', error.message, error.response?.data || '');
            const errorEmbed = createEmbed('#FF5555', '¡Ups, Belén!', 'Algo falló al buscar la respuesta, pero sigo aquí.');
            await waitingMessage.edit({ embeds: [errorEmbed] });
        }
        return;
    }

    if (content.startsWith('!ppm') || content.startsWith('!ppm pls')) {
        await manejarPPM(message);
        return;
    }

    if (content.toLowerCase() === 'hola') {
        sendSuccess(channel, '¡Hola, qué alegría verte!', `Soy Miguel IA, aquí para ayudarte, Belén. ¿Qué tienes en mente?`);
        return;
    }
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

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log(`Instancia ${instanceId} recibió SIGTERM, cerrando bot...`);
    client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
