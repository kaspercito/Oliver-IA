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

const BOT_UPDATES = [
    '¡Trivia sin opciones con muchas preguntas!',
    'Comandos abreviados: !ch, !tr, !rk, !pp, !h, !re.',
    '!re es un juego: escribe la palabra primero y gana.',
    '!ch genera imágenes para preguntas como "¿Cómo es...?".'
];

// Preguntas de trivia organizadas por categorías
const preguntasTriviaSinOpciones = {
const preguntasTriviaSinOpciones = {
    capitales: [
        { pregunta: "¿Cuál es la capital de Brasil?", respuesta: "brasilia" },
        { pregunta: "¿Cuál es la capital de Japón?", respuesta: "tokio" },
        { pregunta: "¿Cuál es la capital de Francia?", respuesta: "parís" },
        { pregunta: "¿Cuál es la capital de Australia?", respuesta: "canberra" },
        { pregunta: "¿Cuál es la capital de Canadá?", respuesta: "ottawa" },
        { pregunta: "¿Cuál es la capital de Rusia?", respuesta: "moscú" },
        { pregunta: "¿Cuál es la capital de India?", respuesta: "nueva delhi" },
        { pregunta: "¿Cuál es la capital de Argentina?", respuesta: "buenos aires" },
        { pregunta: "¿Cuál es la capital de México?", respuesta: "ciudad de méxico" },
        { pregunta: "¿Cuál es la capital de Italia?", respuesta: "roma" },
        { pregunta: "¿Cuál es la capital de España?", respuesta: "madrid" },
        { pregunta: "¿Cuál es la capital de Alemania?", respuesta: "berlín" },
        { pregunta: "¿Cuál es la capital de China?", respuesta: "pekín" },
        { pregunta: "¿Cuál es la capital de Egipto?", respuesta: "el cairo" },
        { pregunta: "¿Cuál es la capital de Sudáfrica?", respuesta: "pretoria" },
        { pregunta: "¿Cuál es la capital de Reino Unido?", respuesta: "londres" },
        { pregunta: "¿Cuál es la capital de Portugal?", respuesta: "lisboa" },
        { pregunta: "¿Cuál es la capital de Grecia?", respuesta: "atenas" },
        { pregunta: "¿Cuál es la capital de Turquía?", respuesta: "ankara" },
        { pregunta: "¿Cuál es la capital de Chile?", respuesta: "santiago" },
        { pregunta: "¿Cuál es la capital de Colombia?", respuesta: "bogotá" },
        { pregunta: "¿Cuál es la capital de Perú?", respuesta: "lima" },
        { pregunta: "¿Cuál es la capital de Suecia?", respuesta: "estocolmo" },
        { pregunta: "¿Cuál es la capital de Noruega?", respuesta: "oslo" },
        { pregunta: "¿Cuál es la capital de Nueva Zelanda?", respuesta: "wellington" }
    ],
    quimica: [
        { pregunta: "¿Qué elemento tiene el símbolo 'H'?", respuesta: "hidrógeno" },
        { pregunta: "¿Qué gas tiene la fórmula CO2?", respuesta: "dióxido de carbono" },
        { pregunta: "¿Qué elemento es un metal líquido a temperatura ambiente?", respuesta: "mercurio" },
        { pregunta: "¿Cuál es el símbolo del oro?", respuesta: "au" },
        { pregunta: "¿Qué compuesto es el agua?", respuesta: "h2o" },
        { pregunta: "¿Qué elemento tiene el símbolo 'O'?", respuesta: "oxígeno" },
        { pregunta: "¿Qué metal tiene el símbolo 'Fe'?", respuesta: "hierro" },
        { pregunta: "¿Qué gas noble tiene el símbolo 'Ne'?", respuesta: "neón" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Na'?", respuesta: "sodio" },
        { pregunta: "¿Qué gas tiene el símbolo 'He'?", respuesta: "helio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'C'?", respuesta: "carbono" },
        { pregunta: "¿Qué metal tiene el símbolo 'Cu'?", respuesta: "cobre" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ag'?", respuesta: "plata" },
        { pregunta: "¿Qué compuesto es el cloruro de sodio?", respuesta: "nacl" },
        { pregunta: "¿Qué gas tiene el símbolo 'N'?", respuesta: "nitrógeno" },
        { pregunta: "¿Qué elemento tiene el símbolo 'K'?", respuesta: "potasio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Pb'?", respuesta: "plomo" },
        { pregunta: "¿Qué elemento tiene el símbolo 'S'?", respuesta: "azufre" },
        { pregunta: "¿Qué gas noble tiene el símbolo 'Ar'?", respuesta: "argón" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Al'?", respuesta: "aluminio" },
        { pregunta: "¿Qué compuesto es el dióxido de azufre?", respuesta: "so2" },
        { pregunta: "¿Qué elemento tiene el símbolo 'P'?", respuesta: "fósforo" }
    ],
    fisica: [
        { pregunta: "¿Qué unidad mide la fuerza?", respuesta: "newton" },
        { pregunta: "¿Qué ley dice que F = m * a?", respuesta: "segunda ley de newton" },
        { pregunta: "¿Cuál es la velocidad de la luz en el vacío (aproximada)?", respuesta: "300000 km/s" },
        { pregunta: "¿Qué instrumento mide la presión atmosférica?", respuesta: "barómetro" },
        { pregunta: "¿Qué tipo de energía almacena un resorte comprimido?", respuesta: "energía elástica" },
        { pregunta: "¿Qué mide la unidad 'voltio'?", respuesta: "voltaje" },
        { pregunta: "¿Quién formuló la teoría de la relatividad?", respuesta: "einstein" },
        { pregunta: "¿Qué mide la unidad 'joule'?", respuesta: "energía" },
        { pregunta: "¿Qué mide la unidad 'watt'?", respuesta: "potencia" },
        { pregunta: "¿Qué ley dice que la energía no se crea ni se destruye?", respuesta: "conservación de la energía" },
        { pregunta: "¿Qué instrumento mide la temperatura?", respuesta: "termómetro" },
        { pregunta: "¿Qué tipo de onda transporta el sonido?", respuesta: "longitudinal" },
        { pregunta: "¿Qué mide la unidad 'hertz'?", respuesta: "frecuencia" },
        { pregunta: "¿Qué fuerza mantiene a los planetas en órbita?", respuesta: "gravedad" },
        { pregunta: "¿Qué mide la unidad 'ohmio'?", respuesta: "resistencia" },
        { pregunta: "¿Qué fenómeno explica la curvatura de la luz por la gravedad?", respuesta: "relatividad general" },
        { pregunta: "¿Qué tipo de energía tiene un objeto en movimiento?", respuesta: "cinética" },
        { pregunta: "¿Qué mide la unidad 'amperio'?", respuesta: "corriente eléctrica" },
        { pregunta: "¿Qué instrumento mide la velocidad del viento?", respuesta: "anemómetro" },
        { pregunta: "¿Qué ley dice que a toda acción hay una reacción igual y opuesta?", respuesta: "tercera ley de newton" }
    ],
    historia: [
        { pregunta: "¿En qué año llegó Colón a América?", respuesta: "1492" },
        { pregunta: "¿Qué civilización construyó las pirámides de Giza?", respuesta: "egipcia" },
        { pregunta: "¿Qué guerra ocurrió entre 1939 y 1945?", respuesta: "segunda guerra mundial" },
        { pregunta: "¿Quién fue el primer emperador de Roma?", respuesta: "augusto" },
        { pregunta: "¿En qué año cayó el Muro de Berlín?", respuesta: "1989" },
        { pregunta: "¿Qué revolución comenzó en 1789?", respuesta: "revolución francesa" },
        { pregunta: "¿Quién pintó la Mona Lisa?", respuesta: "leonardo da vinci" },
        { pregunta: "¿En qué año comenzó la Primera Guerra Mundial?", respuesta: "1914" },
        { pregunta: "¿Qué civilización construyó Machu Picchu?", respuesta: "inca" },
        { pregunta: "¿Quién fue el primer presidente de Estados Unidos?", respuesta: "george washington" },
        { pregunta: "¿En qué año se firmó la Declaración de Independencia de EE.UU.?", respuesta: "1776" },
        { pregunta: "¿Qué imperio fue gobernado por Gengis Kan?", respuesta: "mongol" },
        { pregunta: "¿Quién descubrió la penicilina?", respuesta: "alexander fleming" },
        { pregunta: "¿En qué año terminó la Segunda Guerra Mundial?", respuesta: "1945" },
        { pregunta: "¿Qué civilización inventó la escritura cuneiforme?", respuesta: "sumeria" },
        { pregunta: "¿Quién fue el líder de la Revolución Rusa de 1917?", respuesta: "lenin" },
        { pregunta: "¿En qué año se inventó la imprenta?", respuesta: "1440" },
        { pregunta: "¿Qué reina inglesa tuvo el reinado más largo?", respuesta: "isabel ii" },
        { pregunta: "¿Qué evento marcó el inicio de la Edad Media?", respuesta: "caída de roma" },
        { pregunta: "¿Quién fue el faraón famoso por su tumba llena de tesoros?", respuesta: "tutankamón" }
    ],
    biologia: [
        { pregunta: "¿Qué órgano bombea sangre en el cuerpo humano?", respuesta: "corazón" },
        { pregunta: "¿Cuál es el proceso por el que las plantas hacen su alimento?", respuesta: "fotosíntesis" },
        { pregunta: "¿Qué gas exhalan los humanos al respirar?", respuesta: "dióxido de carbono" },
        { pregunta: "¿Qué parte del cuerpo humano produce insulina?", respuesta: "páncreas" },
        { pregunta: "¿Qué animal es conocido como el rey de la selva?", respuesta: "león" },
        { pregunta: "¿Qué clase de animal es un delfín?", respuesta: "mamífero" },
        { pregunta: "¿Qué estructura en las células contiene el ADN?", respuesta: "núcleo" },
        { pregunta: "¿Qué gas necesitan las plantas para la fotosíntesis?", respuesta: "dióxido de carbono" },
        { pregunta: "¿Qué órgano filtra la sangre en el cuerpo humano?", respuesta: "riñones" },
        { pregunta: "¿Qué animal es el mamífero más grande del mundo?", respuesta: "ballena azul" },
        { pregunta: "¿Qué parte del cuerpo humano controla el equilibrio?", respuesta: "oído" },
        { pregunta: "¿Qué tipo de sangre transportan las arterias?", respuesta: "oxigenada" },
        { pregunta: "¿Qué animal tiene el cuello más largo?", respuesta: "jirafa" },
        { pregunta: "¿Qué insecto produce miel?", respuesta: "abeja" },
        { pregunta: "¿Qué órgano humano digiere los alimentos?", respuesta: "estómago" },
        { pregunta: "¿Qué animal es conocido por cambiar de color?", respuesta: "camaleón" },
        { pregunta: "¿Qué gas respiran los humanos?", respuesta: "oxígeno" },
        { pregunta: "¿Qué parte de la planta absorbe agua del suelo?", respuesta: "raíz" },
        { pregunta: "¿Qué animal tiene un pico y plumas pero no vuela?", respuesta: "pingüino" },
        { pregunta: "¿Qué órgano humano es el más grande?", respuesta: "piel" }
    ],
    juegos: [
        { pregunta: "¿Qué juego tiene un personaje llamado Mario?", respuesta: "super mario" },
        { pregunta: "¿Qué juego incluye a un personaje llamado Link?", respuesta: "the legend of zelda" },
        { pregunta: "¿Qué juego es famoso por su modo battle royale?", respuesta: "fortnite" },
        { pregunta: "¿En qué juego construyes con bloques en un mundo cúbico?", respuesta: "minecraft" },
        { pregunta: "¿Qué juego tiene un personaje llamado Master Chief?", respuesta: "halo" },
        { pregunta: "¿Qué juego incluye a Lara Croft como protagonista?", respuesta: "tomb raider" },
        { pregunta: "¿Qué juego tiene un mapa llamado Summoner's Rift?", respuesta: "league of legends" },
        { pregunta: "¿Qué juego te permite capturar criaturas con pokebolas?", respuesta: "pokémon" },
        { pregunta: "¿Qué juego tiene un personaje llamado Kratos?", respuesta: "god of war" },
        { pregunta: "¿Qué juego es famoso por su modo de carreras Mario Kart?", respuesta: "mario kart" },
        { pregunta: "¿Qué juego tiene un mundo abierto llamado Los Santos?", respuesta: "grand theft auto v" },
        { pregunta: "¿Qué juego incluye a un erizo azul llamado Sonic?", respuesta: "sonic the hedgehog" },
        { pregunta: "¿Qué juego tiene un personaje llamado Solid Snake?", respuesta: "metal gear solid" },
        { pregunta: "¿Qué juego te permite construir granjas y explorar cuevas?", respuesta: "stardew valley" },
        { pregunta: "¿Qué juego tiene un modo de batalla llamado Team Deathmatch?", respuesta: "call of duty" },
        { pregunta: "¿Qué juego incluye a un personaje llamado Geralt de Rivia?", respuesta: "the witcher" },
        { pregunta: "¿Qué juego tiene un mundo postapocalíptico con Vaults?", respuesta: "fallout" },
        { pregunta: "¿Qué juego te permite ser un simulador de vida?", respuesta: "the sims" },
        { pregunta: "¿Qué juego tiene un personaje llamado Ellie en un mundo con infectados?", respuesta: "the last of us" },
        { pregunta: "¿Qué juego incluye combates con cartas como 'Magic'?", respuesta: "hearthstone" }
    ],
    peliculas: [
        { pregunta: "¿Qué película tiene a Jack Sparrow como pirata?", respuesta: "piratas del caribe" },
        { pregunta: "¿Qué película tiene un león rey llamado Mufasa?", respuesta: "el rey león" },
        { pregunta: "¿Qué película tiene un tiburón como antagonista principal?", respuesta: "tiburón" },
        { pregunta: "¿Qué película incluye a un robot llamado WALL-E?", respuesta: "wall-e" },
        { pregunta: "¿Qué película tiene un mago joven que va a Hogwarts?", respuesta: "harry potter" },
        { pregunta: "¿Qué película tiene un superhéroe llamado Tony Stark?", respuesta: "iron man" },
        { pregunta: "¿Qué película incluye un viaje al espacio con HAL 9000?", respuesta: "2001: odisea del espacio" },
        { pregunta: "¿Qué película tiene un personaje llamado Darth Vader?", respuesta: "star wars" },
        { pregunta: "¿Qué película incluye un boxeador llamado Rocky Balboa?", respuesta: "rocky" },
        { pregunta: "¿Qué película tiene un dinosaurio llamado Rex?", respuesta: "toy story" },
        { pregunta: "¿Qué película narra la historia del Titanic?", respuesta: "titanic" },
        { pregunta: "¿Qué película tiene un espía llamado James Bond?", respuesta: "james bond" },
        { pregunta: "¿Qué película incluye una ciudad subterránea llamada Zion?", respuesta: "matrix" },
        { pregunta: "¿Qué película tiene un personaje llamado Forrest Gump?", respuesta: "forrest gump" },
        { pregunta: "¿Qué película incluye un mago blanco llamado Gandalf?", respuesta: "el señor de los anillos" },
        { pregunta: "¿Qué película tiene un arqueólogo llamado Indiana Jones?", respuesta: "indiana jones" },
        { pregunta: "¿Qué película incluye un superhéroe aracnido?", respuesta: "spider-man" },
        { pregunta: "¿Qué película tiene un mundo con sueños robados?", respuesta: "inception" },
        { pregunta: "¿Qué película incluye un club de pelea secreto?", respuesta: "fight club" },
        { pregunta: "¿Qué película tiene un personaje llamado Hannibal Lecter?", respuesta: "el silencio de los corderos" }
    ],
    disney: [
        { pregunta: "¿Qué princesa tiene poderes de hielo?", respuesta: "elsa" },
        { pregunta: "¿Qué princesa tiene una madrastra llamada Lady Tremaine?", respuesta: "cenicienta" },
        { pregunta: "¿Qué película Disney tiene un pez llamado Nemo?", respuesta: "buscando a nemo" },
        { pregunta: "¿Qué personaje Disney es un pato gruñón?", respuesta: "donald" },
        { pregunta: "¿Qué película Disney tiene una lámpara mágica?", respuesta: "aladdín" },
        { pregunta: "¿Qué película Disney tiene un rey león llamado Simba?", respuesta: "el rey león" },
        { pregunta: "¿Qué princesa Disney vive bajo el mar?", respuesta: "ariel" },
        { pregunta: "¿Qué personaje Disney es un ratón famoso?", respuesta: "mickey" },
        { pregunta: "¿Qué película Disney tiene una bestia encantada?", respuesta: "la bella y la bestia" },
        { pregunta: "¿Qué película Disney incluye un perro callejero y una dama?", respuesta: "la dama y el vagabundo" },
        { pregunta: "¿Qué princesa tiene poderes de hielo?", respuesta: "elsa" },
        { pregunta: "¿Qué princesa tiene una madrastra llamada Lady Tremaine?", respuesta: "cenicienta" },
        { pregunta: "¿Qué película tiene un pez llamado Nemo?", respuesta: "buscando a nemo" },
        { pregunta: "¿Qué personaje es un pato gruñón?", respuesta: "donald" },
        { pregunta: "¿Qué película tiene una lámpara mágica?", respuesta: "aladdín" },
        { pregunta: "¿Qué película tiene un rey león llamado Simba?", respuesta: "el rey león" },
        { pregunta: "¿Qué princesa vive bajo el mar?", respuesta: "ariel" },
        { pregunta: "¿Qué personaje es un ratón famoso?", respuesta: "mickey" },
        { pregunta: "¿Qué película tiene una bestia encantada?", respuesta: "la bella y la bestia" },
        { pregunta: "¿Qué película incluye un perro callejero y una dama?", respuesta: "la dama y el vagabundo" }
    ],
    matematicas: [
        { pregunta: "¿Cuánto es 5 + 7?", respuesta: "12" },
        { pregunta: "¿Cuál es el resultado de 3 x 4?", respuesta: "12" },
        { pregunta: "¿Cuánto es 15 - 6?", respuesta: "9" },
        { pregunta: "¿Qué número es el doble de 8?", respuesta: "16" },
        { pregunta: "¿Cuánto es 20 ÷ 4?", respuesta: "5" },
        { pregunta: "¿Cuál es el resultado de 9 + 11?", respuesta: "20" },
        { pregunta: "¿Qué número es la mitad de 10?", respuesta: "5" },
        { pregunta: "¿Cuánto es 7 x 3?", respuesta: "21" },
        { pregunta: "¿Cuál es el resultado de 25 - 13?", respuesta: "12" },
        { pregunta: "¿Cuánto es 6 + 8?", respuesta: "14" },
        { pregunta: "¿Cuál es el resultado de 4 x 5?", respuesta: "20" },
        { pregunta: "¿Cuánto es 18 - 9?", respuesta: "9" },
        { pregunta: "¿Qué número es el triple de 3?", respuesta: "9" },
        { pregunta: "¿Cuánto es 30 ÷ 5?", respuesta: "6" },
        { pregunta: "¿Cuál es el resultado de 12 + 15?", respuesta: "27" },
        { pregunta: "¿Cuánto es 8 x 2?", respuesta: "16" },
        { pregunta: "¿Cuál es el resultado de 50 - 25?", respuesta: "25" },
        { pregunta: "¿Qué número es la mitad de 14?", respuesta: "7" },
        { pregunta: "¿Cuánto es 9 x 4?", respuesta: "36" },
        { pregunta: "¿Cuál es el resultado de 100 ÷ 10?", respuesta: "10" }
    ]
};

// Palabras aleatorias para el juego de reacciones
const palabrasAleatorias = [
    "genial", "cool", "bravo", "sí", "nope", "wow", "jaja", "bien", "mal", "top",
    "luz", "estrella", "risa", "fuego", "agua", "nube", "sol", "luna", "cielo", "tierra",
    "rápido", "lento", "fuerte", "débil", "alto", "bajo", "calor", "frío", "dulce", "salado",
    "gato", "perro", "pájaro", "pez", "oso", "tigre", "león", "mono", "elefante", "jirafa",
    "rojo", "azul", "verde", "amarillo", "negro", "blanco", "rosa", "violeta", "naranja", "gris",
    "casa", "árbol", "río", "montaña", "playa", "bosque", "desierto", "ciudad", "pueblo", "camino",
    "feliz", "triste", "enojado", "calmo", "cansado", "vivo", "raro", "simple", "duro", "suave"
];

// Frases para PPM
const frasesPPM = [
    "el rápido zorro marrón salta sobre el perro perezoso",
    "la vida es como una caja de chocolates nunca sabes qué te va a tocar",
    "un pequeño paso para el hombre un gran salto para la humanidad",
    "el sol brilla más fuerte cuando estás feliz y rodeado de amigos",
    "la práctica hace al maestro no lo olvides nunca en tu camino",
    "el río corre tranquilo bajo el puente de piedra antigua",
    "una abeja zumba alegre mientras recoge néctar de las flores",
    "el viento susurra secretos entre las hojas verdes del bosque",
    "la luna llena ilumina la noche con un brillo plateado mágico",
    "un gato negro cruza el callejón bajo la luz de un farol",
    "el café caliente despierta los sentidos en una mañana fría",
    "las olas del mar chocan contra las rocas con fuerza y espuma",
    "un pájaro canta al amanecer anunciando un nuevo día brillante",
    "la nieve cae suave sobre las montañas en un silencio helado",
    "el tren avanza rápido por las vías dejando atrás el pueblo",
    "una sonrisa sincera puede cambiar el día de cualquiera",
    "el reloj marca las horas mientras el mundo sigue girando",
    "la lluvia golpea las ventanas en una tarde gris y tranquila",
    "un niño corre feliz persiguiendo una cometa en el parque",
    "el desierto guarda misterios bajo su arena dorada y caliente"
];

// Estado
let instanceId = uuidv4();
let activeTrivia = new Map();
let sentMessages = new Map();
let processedMessages = new Map();
let dataStore = { 
    conversationHistory: {}, 
    triviaRanking: {}, // Ahora será { userId: { categoria: { score: X } } }
    personalPPMRecords: {}, 
    reactionStats: {}, 
    reactionWins: {}, 
    activeSessions: {}, 
    triviaStats: {} // Ahora será { userId: { categoria: { correct: X, total: Y } } }
};

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
    return await channel.send({ embeds: [embed] });
};

const sendSuccess = async (channel, title, message) => {
    const embed = createEmbed('#55FF55', title, message);
    return await channel.send({ embeds: [embed] });
};

function cleanText(text) {
    return text.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/^(el|la|los|las)\s+/i, '');
}

// Generar imagen
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
                timeout: 90000
            }
        );
        const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:image/png;base64,${imageBase64}`;
    } catch (error) {
        console.error('Error al generar imagen:', error.message);
        throw error;
    }
}

// Persistencia en GitHub
async function loadDataStore() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        const loadedData = content ? JSON.parse(content) : { 
            conversationHistory: {}, 
            triviaRanking: {}, 
            personalPPMRecords: {}, 
            reactionStats: {}, 
            reactionWins: {}, 
            activeSessions: {}, 
            triviaStats: {} 
        };
        console.log('Datos cargados desde GitHub:', JSON.stringify(loadedData));
        return loadedData;
    } catch (error) {
        console.error('Error al cargar datos desde GitHub:', error.message);
        return { 
            conversationHistory: {}, 
            triviaRanking: {}, 
            personalPPMRecords: {}, 
            reactionStats: {}, 
            reactionWins: {}, 
            activeSessions: {}, 
            triviaStats: {} 
        };
    }
}

async function saveDataStore() {
    try {
        let sha;
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
                { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
            );
            sha = response.data.sha;
        } catch (error) {
            if (error.response?.status !== 404) throw error;
        }

        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                message: 'Actualizar historial y sesiones',
                content: Buffer.from(JSON.stringify(dataStore, null, 2)).toString('base64'),
                sha: sha || undefined,
            },
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );
        console.log('Datos guardados en GitHub:', JSON.stringify(dataStore));
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
        throw error;
    }
}

// Guardar cada 10 minutos
setInterval(() => {
    saveDataStore();
}, 600000);

// Funciones de Trivia
function obtenerPreguntaTriviaSinOpciones(usedQuestions, categoria) {
    const preguntasCategoria = preguntasTriviaSinOpciones[categoria] || [];
    const available = preguntasCategoria.filter(q => !usedQuestions.includes(q.pregunta));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

async function manejarTrivia(message) {
    console.log(`Instancia ${instanceId} - Iniciando trivia para ${message.author.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().split(' ').slice(1);
    let categoria = args[0] || 'capitales'; // Por defecto: capitales
    let numQuestions = 10;
    if (args[1] && !isNaN(args[1]) && args[1] >= 10) numQuestions = parseInt(args[1]);
    else if (args[0] && !isNaN(args[0]) && args[0] >= 10) {
        numQuestions = parseInt(args[0]);
        categoria = 'capitales'; // Si solo hay número, usar capitales
    }

    if (!preguntasTriviaSinOpciones[categoria]) {
        await sendError(message.channel, `Categoría "${categoria}" no encontrada. Categorías disponibles: ${Object.keys(preguntasTriviaSinOpciones).join(', ')}`);
        return;
    }

    let channelProgress = dataStore.activeSessions[message.channel.id] || { 
        type: 'trivia', 
        currentQuestion: 0, 
        score: 0, 
        totalQuestions: numQuestions, 
        usedQuestions: [], 
        categoria: categoria 
    };
    const usedQuestions = channelProgress.usedQuestions || [];

    while (channelProgress.currentQuestion < numQuestions) {
        const trivia = obtenerPreguntaTriviaSinOpciones(usedQuestions, categoria);
        if (!trivia) {
            await sendError(message.channel, 'No hay más preguntas disponibles en esta categoría.');
            break;
        }
        usedQuestions.push(trivia.pregunta);
        const embedPregunta = createEmbed('#55FFFF', `🎲 ¡Pregunta ${channelProgress.currentQuestion + 1} de ${numQuestions}! (${categoria})`,
            `${trivia.pregunta}\n\nEscribe tu respuesta (60 segundos), ${userName}.`);
        const sentMessage = await message.channel.send({ embeds: [embedPregunta] });
        activeTrivia.set(message.channel.id, { id: sentMessage.id, correcta: trivia.respuesta, timestamp: Date.now(), userId: message.author.id });

        channelProgress.usedQuestions = usedQuestions;
        dataStore.activeSessions[message.channel.id] = channelProgress;

        try {
            console.log(`Esperando respuesta para pregunta ${channelProgress.currentQuestion + 1}: ${trivia.pregunta}`);
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => {
                    console.log(`Filtrando respuesta de ${res.author.id} (esperado: ${message.author.id}): "${res.content}"`);
                    return res.author.id === message.author.id && res.content.trim().length > 0;
                },
                max: 1,
                time: 60000,
                errors: ['time']
            });
            const respuestaUsuario = respuestas.first().content;
            console.log(`Respuesta recibida: "${respuestaUsuario}"`);
            const cleanedUserResponse = cleanText(respuestaUsuario);
            const cleanedCorrectResponse = cleanText(trivia.respuesta);
            activeTrivia.delete(message.channel.id);

            if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
            if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
            dataStore.triviaStats[message.author.id][categoria].total += 1;

            if (cleanedUserResponse === cleanedCorrectResponse) {
                channelProgress.score += 1;
                dataStore.triviaStats[message.author.id][categoria].correct += 1;
                await sendSuccess(message.channel, '🎉 ¡Correcto!',
                    `¡Bien hecho, ${userName}! La respuesta correcta era **${trivia.respuesta}**. ¡Ganaste 1 punto! (Total: ${channelProgress.score})`);
            } else {
                await sendError(message.channel, '❌ ¡Casi!',
                    `Lo siento, ${userName}, la respuesta correcta era **${trivia.respuesta}**. Tu respuesta fue "${respuestaUsuario}".`);
            }
            channelProgress.currentQuestion += 1;
            dataStore.activeSessions[message.channel.id] = channelProgress;
            console.log(`Avanzando a pregunta ${channelProgress.currentQuestion + 1}`);
        } catch (error) {
            console.log(`Tiempo agotado o error en pregunta ${channelProgress.currentQuestion + 1}: ${trivia.pregunta}`, error);
            activeTrivia.delete(message.channel.id);
            if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
            if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
            dataStore.triviaStats[message.author.id][categoria].total += 1;
            await sendError(message.channel, '⏳ ¡Tiempo agotado!',
                `Se acabó el tiempo, ${userName}. La respuesta correcta era **${trivia.respuesta}**.`);
            channelProgress.currentQuestion += 1;
            dataStore.activeSessions[message.channel.id] = channelProgress;
        }
    }

    if (channelProgress.currentQuestion >= numQuestions) {
        await sendSuccess(message.channel, '🏁 ¡Trivia Terminada!',
            `¡Completaste las ${numQuestions} preguntas de ${categoria}, ${userName}! Puntuación final: ${channelProgress.score}. Usa !rk para ver tu ranking.`);
        if (!dataStore.triviaRanking[message.author.id]) dataStore.triviaRanking[message.author.id] = {};
        if (!dataStore.triviaRanking[message.author.id][categoria]) dataStore.triviaRanking[message.author.id][categoria] = { score: 0 };
        dataStore.triviaRanking[message.author.id][categoria].score = (dataStore.triviaRanking[message.author.id][categoria].score || 0) + channelProgress.score;
        delete dataStore.activeSessions[message.channel.id];
        console.log(`Trivia terminada para ${message.author.id} en ${categoria}. Puntaje acumulado: ${dataStore.triviaRanking[message.author.id][categoria].score}`);
    }
}

// PPM
function obtenerFrasePPM() {
    return frasesPPM[Math.floor(Math.random() * frasesPPM.length)];
}

async function manejarPPM(message) {
    console.log(`Instancia ${instanceId} - Iniciando PPM para ${message.author.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    let session = dataStore.activeSessions[message.author.id] || { type: 'ppm', startTime: null, frase: null, completed: false };
    if (session.startTime && !session.completed) {
        return sendError(message.channel, `Ya tienes una prueba PPM activa, ${userName}. Termina la actual primero.`);
    }

    const countdownEmbed = createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en 3...`);
    const countdownMessage = await message.channel.send({ embeds: [countdownEmbed] });

    for (let i = 2; i >= 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedEmbed = createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en ${i}...`);
        await countdownMessage.edit({ embeds: [updatedEmbed] });
    }

    const goEmbed = createEmbed('#00FF00', '🚀 ¡Ya!', `¡Adelante, ${userName}!`);
    await countdownMessage.edit({ embeds: [goEmbed] });

    const frase = obtenerFrasePPM();
    const startTime = Date.now();
    const embed = createEmbed('#55FFFF', '📝 Prueba de Mecanografía',
        `Escribe esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTienes 60 segundos, ${userName}.`);
    await message.channel.send({ embeds: [embed] });

    session.startTime = startTime;
    session.frase = frase;
    session.completed = false;
    dataStore.activeSessions[message.author.id] = session;

    try {
        console.log(`Esperando respuesta para PPM: "${frase}"`);
        const respuestas = await message.channel.awaitMessages({
            filter: (res) => res.author.id === message.author.id && res.content.trim().length > 0,
            max: 1,
            time: 60000,
            errors: ['time']
        });
        const respuestaUsuario = respuestas.first().content;
        const endTime = Date.now();
        session.completed = true;
        delete dataStore.activeSessions[message.author.id];

        const tiempoSegundos = (endTime - startTime) / 1000;
        const palabras = frase.split(' ').length;
        const ppm = Math.round((palabras / tiempoSegundos) * 60);

        if (!dataStore.personalPPMRecords[message.author.id]) dataStore.personalPPMRecords[message.author.id] = [];
        dataStore.personalPPMRecords[message.author.id] = dataStore.personalPPMRecords[message.author.id].filter(record => 
            new Date().getTime() - new Date(record.timestamp).getTime() < 24 * 60 * 60 * 1000);
        dataStore.personalPPMRecords[message.author.id].push({ ppm, timestamp: new Date().toISOString() });

        if (cleanText(respuestaUsuario) === cleanText(frase)) {
            await sendSuccess(message.channel, '🎉 ¡Perfecto!',
                `¡Bien hecho, ${userName}! Escribiste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu velocidad: **${ppm} PPM**. Usa !rk para ver tus récords.`);
        } else {
            await sendError(message.channel, '❌ ¡Casi!',
                `Lo siento, ${userName}, no escribiste la frase correctamente. Tu respuesta fue "${respuestaUsuario}". ¡Intenta de nuevo con !pp!`);
        }
    } catch (error) {
        console.log('Tiempo agotado en PPM:', error);
        session.completed = true;
        delete dataStore.activeSessions[message.author.id];
        await sendError(message.channel, '⏳ ¡Tiempo agotado!',
            `Se acabó el tiempo, ${userName}. La frase era: **${frase}**. Usa !pp para intentarlo de nuevo.`);
    }
}

// Reacciones
function obtenerPalabraAleatoria() {
    return palabrasAleatorias[Math.floor(Math.random() * palabrasAleatorias.length)];
}

async function manejarReacciones(message) {
    console.log(`Instancia ${instanceId} - Iniciando juego de reacciones en canal ${message.channel.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    let session = dataStore.activeSessions[message.channel.id] || { type: 'reaction', palabra: null, timestamp: null, completed: false };
    if (session.palabra && !session.completed) {
        return sendError(message.channel, `Ya hay un juego de reacciones activo en este canal, ${userName}. ¡Espera a que termine!`);
    }

    const palabra = obtenerPalabraAleatoria();
    const startTime = Date.now();
    const embed = createEmbed('#FFD700', '🏁 ¡Juego de Reacciones!',
        `¡Escribe esta palabra lo más rápido que puedas: **${palabra}**!\n\nEl primero en escribirla gana. Tienes 30 segundos.`);
    await message.channel.send({ embeds: [embed] });

    session.palabra = palabra;
    session.timestamp = startTime;
    session.completed = false;
    dataStore.activeSessions[message.channel.id] = session;

    try {
        console.log(`Esperando respuesta para palabra: "${palabra}"`);
        const respuestas = await message.channel.awaitMessages({
            filter: (res) => res.content.toLowerCase().trim() === palabra,
            max: 1,
            time: 30000,
            errors: ['time']
        });
        const ganador = respuestas.first().author;
        const endTime = Date.now();
        const tiempoSegundos = (endTime - startTime) / 1000;
        const ganadorName = ganador.id === OWNER_ID ? 'Miguel' : 'Belén';
        session.completed = true;
        delete dataStore.activeSessions[message.channel.id];

        if (!dataStore.reactionWins[ganador.id]) dataStore.reactionWins[ganador.id] = { username: ganador.username, wins: 0 };
        dataStore.reactionWins[ganador.id].wins += 1;
        console.log(`Reacción ganada por ${ganador.id}. Victorias: ${dataStore.reactionWins[ganador.id].wins}`);

        await sendSuccess(message.channel, '🎉 ¡Ganador!',
            `¡Felicidades, ${ganadorName}! Fuiste el primero en escribir **${palabra}** en ${tiempoSegundos.toFixed(2)} segundos. ¡Eres rapidísimo! Mira tu progreso con !rk.`);
    } catch (error) {
        console.log('Tiempo agotado en reacciones:', error);
        session.completed = true;
        delete dataStore.activeSessions[message.channel.id];
        await sendError(message.channel, '⏳ ¡Tiempo agotado!',
            `Nadie escribió **${palabra}** a tiempo. ¡Mejor suerte la próxima vez con !re!`);
    }
}

// Chat
async function manejarChat(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const chatMessage = message.content.startsWith('!chat') ? message.content.slice(5).trim() : message.content.slice(3).trim();
    if (!chatMessage) return sendError(message.channel, `Escribe un mensaje después de "!ch", ${userName}.`);

    const waitingEmbed = createEmbed('#55FFFF', `¡Un momento, ${userName}!`, 'Espera, estoy buscando una respuesta...');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        let aiReply;
        const lowerMessage = chatMessage.toLowerCase();

        if (lowerMessage === 'hola') {
            aiReply = `¡Hola, ${userName}! ¿En qué puedo ayudarte hoy?`;
        } else if (lowerMessage.match(/cu[áa]nto es\s*(\d+)\s*\+s*(\d+)/)) {
            const match = lowerMessage.match(/cu[áa]nto es\s*(\d+)\s*\+s*(\d+)/);
            const num1 = parseInt(match[1]);
            const num2 = parseInt(match[2]);
            const result = num1 + num2;
            aiReply = `¡Fácil, ${userName}! ${num1} + ${num2} = **${result}**. ¿Otra cuenta?`;
        } else if (lowerMessage.includes('cómo es') && lowerMessage.includes('rata negra')) {
            aiReply = `Una rata negra (Rattus rattus) es un roedor de cuerpo alargado, color negro o gris oscuro, hocico puntiagudo, orejas grandes y cola larga. Son ágiles y viven en lugares altos, ${userName}. Mira esta imagen generada:`;
            const imageUrl = await generateImage("A realistic black rat (Rattus rattus) with a pointed snout, large ears, and a long thin tail");
            const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, aiReply).setImage(imageUrl);
            const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
            await updatedMessage.react('✅');
            await updatedMessage.react('❌');
            sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });
            return;
        } else {
            console.log(`Consultando API para: "${chatMessage}"`);
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                {
                    inputs: `Eres Miguel IA, creado por Miguel. Responde a "${chatMessage}" de forma natural, detallada y útil para ${userName}. Si es un cálculo, resuélvelo; si no sabes, sugiere algo práctico.`,
                    parameters: { max_new_tokens: 500, return_full_text: false }
                },
                { headers: { 'Authorization': `Bearer ${process.env.HF_API_TOKEN}` }, timeout: 90000 }
            );
            aiReply = response.data[0]?.generated_text?.trim() || `No sé cómo responder a eso, ${userName}. ¿Puedes darme más detalles?`;
        }

        aiReply += `\n\n¿Te ayudó esto, ${userName}?`;
        const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, aiReply);
        const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
        await updatedMessage.react('✅');
        await updatedMessage.react('❌');
        sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });
    } catch (error) {
        console.error('Error en !chat:', error.message);
        const errorEmbed = createEmbed('#FF5555', '¡Ups!', `Algo salió mal, ${userName}. Error: ${error.message}. ¡Intenta de nuevo o reformula tu pregunta!`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Ranking con top por categoría para Trivia y Reacciones
function getCombinedRankingEmbed(userId, username) {
    const categorias = Object.keys(preguntasTriviaSinOpciones); // Esto ahora incluye 'matematicas' y no 'disney'
    let triviaList = '';
    categorias.forEach(categoria => {
        const myScore = dataStore.triviaRanking[OWNER_ID]?.[categoria]?.score || 0;
        const luzScore = dataStore.triviaRanking[ALLOWED_USER_ID]?.[categoria]?.score || 0;
        const myStats = dataStore.triviaStats[OWNER_ID]?.[categoria] || { correct: 0, total: 0 };
        const luzStats = dataStore.triviaStats[ALLOWED_USER_ID]?.[categoria] || { correct: 0, total: 0 };
        const myPercentage = myStats.total > 0 ? Math.round((myStats.correct / myStats.total) * 100) : 0;
        const luzPercentage = luzStats.total > 0 ? Math.round((luzStats.correct / luzStats.total) * 100) : 0;

        triviaList += `${categoria.charAt(0).toUpperCase() + categoria.slice(1)}:\n` +
                      `Miguel: **${myScore} puntos** (${myPercentage}% acertadas)\n` +
                      `Belén: **${luzScore} puntos** (${luzPercentage}% acertadas)\n\n`;
    });

    // PPM personal
    const ppmRecords = dataStore.personalPPMRecords[userId] || [];
    let ppmList = ppmRecords.length > 0 
        ? ppmRecords.map(record => `${record.ppm} PPM (${new Date(record.timestamp).toLocaleString()})`).join('\n')
        : 'No has hecho pruebas de PPM aún.';

    // Reacciones para ambos
    const myReactionWins = dataStore.reactionWins[OWNER_ID]?.wins || 0;
    const luzReactionWins = dataStore.reactionWins[ALLOWED_USER_ID]?.wins || 0;
    const reactionList = `Miguel: **${myReactionWins} victorias**\nBelén: **${luzReactionWins} victorias**`;

    return createEmbed('#FFD700', `🏆 Ranking de ${username}`,
        `Trivia:\n${triviaList}` +
        `PPM:\n${ppmList}\n` +
        `Victorias en Reacciones:\n${reactionList}`);
}

// Comandos
async function manejarCommand(message) {
    const content = message.content.toLowerCase();
    console.log(`Comando recibido: ${content}`);
    if (content.startsWith('!trivia') || content.startsWith('!tr')) {
        await manejarTrivia(message);
    } else if (content.startsWith('!chat') || content.startsWith('!ch')) {
        await manejarChat(message);
    } else if (content.startsWith('!ppm') || content.startsWith('!pp')) {
        await manejarPPM(message);
    } else if (content.startsWith('!reacciones') || content.startsWith('!re')) {
        await manejarReacciones(message);
    } else if (content === '!save') {
        const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
        try {
            await saveDataStore();
            await sendSuccess(message.channel, '💾 ¡Guardado!', `Datos guardados exitosamente, ${userName}. Estado actual: ${JSON.stringify(dataStore)}`);
        } catch (error) {
            await sendError(message.channel, '💾 Error al guardar', `No pude guardar los datos, ${userName}. Error: ${error.message}`);
        }
    }
}

// Eventos
client.once('ready', async () => {
    console.log(`¡Miguel IA está listo! Instancia: ${instanceId}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudar a Miguel y Belén", type: 0 }], status: 'online' });
    dataStore = await loadDataStore();
    activeTrivia = new Map(Object.entries(dataStore.activeSessions).filter(([_, s]) => s.type === 'trivia'));
    console.log('Sesiones activas recargadas:', JSON.stringify(dataStore.activeSessions));
});

process.on('beforeExit', async () => {
    console.log('Guardando datos antes de salir...');
    await saveDataStore();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (![OWNER_ID, ALLOWED_USER_ID].includes(message.author.id)) return;

    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (processedMessages.has(message.id)) return;
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

    await manejarCommand(message);

    const content = message.content.toLowerCase();
    if (content.startsWith('!ranking') || content.startsWith('!rk')) {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
        } else if (content.startsWith('!help') || content.startsWith('!h')) {
        const embed = createEmbed('#55FF55', `¡Comandos para ti, ${userName}!`,
            '¡Aquí tienes lo que puedo hacer!\n' +
            '- **!ch / !chat [mensaje]**: Charla conmigo.\n' +
            '- **!tr / !trivia [categoría] [n]**: Trivia por categoría (mínimo 10). Categorías: ' + Object.keys(preguntasTriviaSinOpciones).join(', ') + '\n' +
            '- **!pp / !ppm**: Prueba de mecanografía.\n' +
            '- **!rk / !ranking**: Ver puntajes y estadísticas.\n' +
            '- **!re / !reacciones**: Juego de escribir rápido.\n' +
            '- **!save**: Guardar datos ahora.\n' +
            '- **!h / !help**: Lista de comandos.\n' +
            '- **hola**: Saludo especial.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === 'hola') {
        await sendSuccess(message.channel, `¡Hola, ${userName}!`, `Soy Miguel IA, aquí para ayudarte. Prueba !tr, !pp o !re.`);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (!sentMessages.has(reaction.message.id)) return;
    if (![OWNER_ID, ALLOWED_USER_ID].includes(user.id)) return;

    const messageData = sentMessages.get(reaction.message.id);
    const userName = user.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (reaction.emoji.name === '❌') {
        const alternativeEmbed = createEmbed('#55FFFF', `¡Probemos otra vez, ${userName}!`,
            `No te gustó mi respuesta a "${messageData.originalQuestion}". Dame más detalles y lo intento de nuevo.`);
        const newMessage = await reaction.message.channel.send({ embeds: [alternativeEmbed] });
        await newMessage.react('✅');
        await newMessage.react('❌');
        sentMessages.set(newMessage.id, { content: alternativeEmbed.data.description, originalQuestion: messageData.originalQuestion, message: newMessage });
    }
});

client.login(process.env.DISCORD_TOKEN);
