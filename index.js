const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Manager } = require('erela.js');
const Spotify = require('erela.js-spotify');
const puppeteer = require('puppeteer');
const lyricsFinder = require('lyrics-finder');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // Necesario para música
    ],
});

// IDs y constantes
const OWNER_ID = '752987736759205960'; // Tu ID
const ALLOWED_USER_ID = '1023132788632862761'; // ID de Belén
const CHANNEL_ID = '1343749554905940058'; // Canal principal
const API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1';
const API_TOKEN = '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'; // Reemplazá con tu token

// Configuración del administrador de música con Erela.js
const manager = new Manager({
    nodes: [
        {
            host: 'lava-v3.ajieblogs.eu.org',
            port: 443,
            password: 'https://dsc.gg/ajidevserver',
            secure: true,
        },
    ],
    plugins: [
        new Spotify({
            clientID: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
});

const BOT_UPDATES = [
    '¡Chat mejorado! Segunda respuesta automática al darle ❌, pa’ que sea más bacán y no pida detalles de una.',
    'Optimizado el código un poco, si te gustaría agregar algo más puedes solicitarlo, espero este bot cumpla con tus expectativas.',
    'Mayúsculas bloqueadas en el canal de texto.',
    '!autosave funcional, cuando no quieras que falle o cualquier cosa lo haces, esto hará que no falle nada, ni se reinicie el bot.',
    '!save funcional, haz el guardado al instante por si quieres asegurarte que todo se conservará.',
    '!reacciones ahora va como trivia: una palabra tras otra hasta que lo parás con !re o fallás, ¡a meterle velocidad, che!',
    '!ppm cambiado: si te equivocás o se te pasa el tiempo, te tira otra frase; si la hacés bien, termina ahí, ¡posta!',
    '!resp / !responder metido: para poder recibir ayuda en lo que necesites, ¡posta!',
    '¡Trivia, reacciones y PPM ahora con cancelación posta! Usá !tc, !rc o !pc pa’ parar al toque sin quilombo.',
    'Miguel (OWNER_ID) ahora puede usar todos los comandos y participar en los juegos, ¡a romperla, loco!',
    'Ranking (!rk) mejorado: muestra a Miguel y Belén, ordenados por quién tiene más puntos en trivia, PPM y reacciones.',
    '¡Reacciones arregladas! Ahora se cancelan bien con !rc y no siguen tirando mensajes después de parar.',
    '¡Nuevo !idea agregado! Tirale ideas al bot con !id y las manda solo a Miguel por MD, ¡posta!',
    'Sincronizado triviaRanking con triviaStats pa’ que los puntajes sean posta y no haya más errores raros en el ranking.',
    '**LO NUEVO**',
    '¡Nuevo !dato / !dt agregado! Busco datos rápidos en la web o X pa’ que sepas todo al toque.',
    '¡Clima al toque con !clima! Te digo cómo está el tiempo en cualquier ciudad, ideal pa’l asado o el mate.',
    '¡Noticias rápidas con !noticias! Te traigo el último titular de Argentina, re copado.',
    '¡Wiki Bot con !wiki! Busco resúmenes en Wikipedia pa’ que aprendas sin esfuerzo.',
    '¡Traductor piola con !traducí! Traduzco frases cortas a cualquier idioma, joya pa’ practicar.',
    "¡Oliver ahora se acuerda de las últimas 20 charlas, posta! Preguntale lo que sea con !chat y sigue la onda como amigo piola.",
    "El mensaje diario a Belén ahora se envía una vez por día y respeta las reacciones ✅ o ❌ pa' no spamear. Si reacciona, no se repite hasta mañana, ¡posta!",
    "¡Arreglado la opción de segunda respuestas uando reaccionás con ❌! Más rápido y copado, loco.",
    '¡Nuevo !imagen / !im agregado! Generá imágenes zarpadas con Stable Diffusion, pedí lo que quieras (ej. !imagen un mate [cartoon]) y confirmá con ✅, loco.',
    '¡Historial de imágenes con !misimagenes / !mi! Mirá tus últimas 5 imágenes generadas con sus IDs, pa’ que no pierdas nada, che.',
    '¡Edición piola con !editarimagen / !ei! Modificá tus imágenes guardadas (ej. !editarimagen [ID] agregar un perro), solo las que hice yo, ¡posta!',
    '¡Solucionado el error con las imágenes, ahora sí funciona como la puta madre!',
    '¡Nuevo !ansiedad / !an agregado! Consejos rápidos pa’ calmar la ansiedad, con un mensaje zarpado de Miguel pa’ darte pilas, ¡genia!'
];

// Mensajes de ánimo para Belén
const mensajesAnimo = [
    "¡Belén, no es verdad que todos te odian! Eres increíble y tienes un corazón enorme. Aquí estoy para recordártelo siempre.",
    "No digas eso, Belén. Eres una persona especial y valiosa, y hay mucha gente que te aprecia, ¡incluyéndome a mí!",
    "Belén, tú (iluminas) el día de cualquiera con tu energía. Nadie podría odiarte, ¡eres un tesoro!",
    "¡Nada de eso, Belén! Eres divertida, inteligente y única. Todos los que te conocen saben lo genial que eres.",
    "Belén, no te sientas así. Tienes un montón de cosas buenas que ofrecer, y yo siempre estaré aquí para apoyarte.",
    "¡Ey, Belén! Eres demasiado awesome para que alguien te odie. Además, tienes fans como yo que te adoran.",
    "Belén, eres un sol, y si alguien no lo ve, es su pérdida. ¡Tú sigue brillando, que aquí te queremos mucho!"
];

// Preguntas de trivia organizadas por categorías
const preguntasTriviaSinOpciones = {
    capitales: [
        { pregunta: "¿Cuál es la capital de Afganistán?", respuesta: "kabul" },
        { pregunta: "¿Cuál es la capital de Albania?", respuesta: "tirana" },
        { pregunta: "¿Cuál es la capital de Alemania?", respuesta: "berlin" },
        { pregunta: "¿Cuál es la capital de Andorra?", respuesta: "andorra la vella" },
        { pregunta: "¿Cuál es la capital de Angola?", respuesta: "luanda" },
        { pregunta: "¿Cuál es la capital de Antigua y Barbuda?", respuesta: "saint john's" },
        { pregunta: "¿Cuál es la capital de Arabia Saudita?", respuesta: "riad" },
        { pregunta: "¿Cuál es la capital de Argelia?", respuesta: "argel" },
        { pregunta: "¿Cuál es la capital de Argentina?", respuesta: "buenos aires" },
        { pregunta: "¿Cuál es la capital de Armenia?", respuesta: "erevan" },
        { pregunta: "¿Cuál es la capital de Australia?", respuesta: "canberra" },
        { pregunta: "¿Cuál es la capital de Austria?", respuesta: "viena" },
        { pregunta: "¿Cuál es la capital de Azerbaiyán?", respuesta: "baku" },
        { pregunta: "¿Cuál es la capital de Bahamas?", respuesta: "nasau" },
        { pregunta: "¿Cuál es la capital de Bangladés?", respuesta: "daca" },
        { pregunta: "¿Cuál es la capital de Barbados?", respuesta: "bridgetown" },
        { pregunta: "¿Cuál es la capital de Baréin?", respuesta: "manama" },
        { pregunta: "¿Cuál es la capital de Bélgica?", respuesta: "bruselas" },
        { pregunta: "¿Cuál es la capital de Belice?", respuesta: "belmopan" },
        { pregunta: "¿Cuál es la capital de Benín?", respuesta: "porto-novo" },
        { pregunta: "¿Cuál es la capital de Bielorrusia?", respuesta: "minsk" },
        { pregunta: "¿Cuál es la capital de Birmania (Myanmar)?", respuesta: "neipyido" },
        { pregunta: "¿Cuál es la capital de Bolivia?", respuesta: "sucre" }, // Nota: La Paz es sede de gobierno, pero Sucre es la capital constitucional
        { pregunta: "¿Cuál es la capital de Bosnia y Herzegovina?", respuesta: "sarajevo" },
        { pregunta: "¿Cuál es la capital de Botsuana?", respuesta: "gaborone" },
        { pregunta: "¿Cuál es la capital de Brasil?", respuesta: "brasilia" },
        { pregunta: "¿Cuál es la capital de Brunéi?", respuesta: "bandar seri begawan" },
        { pregunta: "¿Cuál es la capital de Bulgaria?", respuesta: "sofia" },
        { pregunta: "¿Cuál es la capital de Burkina Faso?", respuesta: "uagadugú" },
        { pregunta: "¿Cuál es la capital de Burundi?", respuesta: "gitega" },
        { pregunta: "¿Cuál es la capital de Bután?", respuesta: "timbu" },
        { pregunta: "¿Cuál es la capital de Cabo Verde?", respuesta: "praia" },
        { pregunta: "¿Cuál es la capital de Camboya?", respuesta: "nom pen" },
        { pregunta: "¿Cuál es la capital de Camerún?", respuesta: "yaundé" },
        { pregunta: "¿Cuál es la capital de Canadá?", respuesta: "ottawa" },
        { pregunta: "¿Cuál es la capital de Catar?", respuesta: "doha" },
        { pregunta: "¿Cuál es la capital de Chad?", respuesta: "yamena" },
        { pregunta: "¿Cuál es la capital de Chile?", respuesta: "santiago" },
        { pregunta: "¿Cuál es la capital de China?", respuesta: "pekin" },
        { pregunta: "¿Cuál es la capital de Chipre?", respuesta: "nicosia" },
        { pregunta: "¿Cuál es la capital de Colombia?", respuesta: "bogota" },
        { pregunta: "¿Cuál es la capital de Comoras?", respuesta: "moroni" },
        { pregunta: "¿Cuál es la capital de Corea del Norte?", respuesta: "pyongyang" },
        { pregunta: "¿Cuál es la capital de Corea del Sur?", respuesta: "seul" },
        { pregunta: "¿Cuál es la capital de Costa de Marfil?", respuesta: "yamusukro" },
        { pregunta: "¿Cuál es la capital de Costa Rica?", respuesta: "san jose" },
        { pregunta: "¿Cuál es la capital de Croacia?", respuesta: "zagreb" },
        { pregunta: "¿Cuál es la capital de Cuba?", respuesta: "la habana" },
        { pregunta: "¿Cuál es la capital de Dinamarca?", respuesta: "copenhague" },
        { pregunta: "¿Cuál es la capital de Dominica?", respuesta: "roseau" },
        { pregunta: "¿Cuál es la capital de Ecuador?", respuesta: "quito" },
        { pregunta: "¿Cuál es la capital de Egipto?", respuesta: "el cairo" },
        { pregunta: "¿Cuál es la capital de El Salvador?", respuesta: "san salvador" },
        { pregunta: "¿Cuál es la capital de Emiratos Árabes Unidos?", respuesta: "abu dabi" },
        { pregunta: "¿Cuál es la capital de Eritrea?", respuesta: "asmara" },
        { pregunta: "¿Cuál es la capital de Eslovaquia?", respuesta: "bratislava" },
        { pregunta: "¿Cuál es la capital de Eslovenia?", respuesta: "liubliana" },
        { pregunta: "¿Cuál es la capital de España?", respuesta: "madrid" },
        { pregunta: "¿Cuál es la capital de Estados Unidos?", respuesta: "washington dc" },
        { pregunta: "¿Cuál es la capital de Estonia?", respuesta: "tallin" },
        { pregunta: "¿Cuál es la capital de Esuatini (Suazilandia)?", respuesta: "mbabane" }, // Nota: Lobamba es la capital legislativa, pero Mbabane es administrativa
        { pregunta: "¿Cuál es la capital de Etiopía?", respuesta: "adís abeba" },
        { pregunta: "¿Cuál es la capital de Fiyi?", respuesta: "suva" },
        { pregunta: "¿Cuál es la capital de Filipinas?", respuesta: "manila" },
        { pregunta: "¿Cuál es la capital de Finlandia?", respuesta: "helsinki" },
        { pregunta: "¿Cuál es la capital de Francia?", respuesta: "paris" },
        { pregunta: "¿Cuál es la capital de Gabón?", respuesta: "libreville" },
        { pregunta: "¿Cuál es la capital de Gambia?", respuesta: "banjul" },
        { pregunta: "¿Cuál es la capital de Georgia?", respuesta: "tbilisi" },
        { pregunta: "¿Cuál es la capital de Ghana?", respuesta: "accra" },
        { pregunta: "¿Cuál es la capital de Grecia?", respuesta: "atenas" },
        { pregunta: "¿Cuál es la capital de Granada?", respuesta: "saint george's" },
        { pregunta: "¿Cuál es la capital de Guatemala?", respuesta: "ciudad de guatemala" },
        { pregunta: "¿Cuál es la capital de Guinea?", respuesta: "conakri" },
        { pregunta: "¿Cuál es la capital de Guinea-Bisáu?", respuesta: "bisáu" },
        { pregunta: "¿Cuál es la capital de Guinea Ecuatorial?", respuesta: "malabo" }, // Nota: Ciudad de la Paz está en construcción, pero Malabo sigue siendo oficial
        { pregunta: "¿Cuál es la capital de Guyana?", respuesta: "georgetown" },
        { pregunta: "¿Cuál es la capital de Haití?", respuesta: "puerto principe" },
        { pregunta: "¿Cuál es la capital de Honduras?", respuesta: "tegucigalpa" },
        { pregunta: "¿Cuál es la capital de Hungría?", respuesta: "budapest" },
        { pregunta: "¿Cuál es la capital de India?", respuesta: "nueva delhi" },
        { pregunta: "¿Cuál es la capital de Indonesia?", respuesta: "yakarta" }, // Nota: Nusantara está en desarrollo, pero Yakarta sigue siendo oficial
        { pregunta: "¿Cuál es la capital de Irak?", respuesta: "bagdad" },
        { pregunta: "¿Cuál es la capital de Irán?", respuesta: "teheran" },
        { pregunta: "¿Cuál es la capital de Irlanda?", respuesta: "dublin" },
        { pregunta: "¿Cuál es la capital de Islandia?", respuesta: "reikiavik" },
        { pregunta: "¿Cuál es la capital de Islas Marshall?", respuesta: "majuro" },
        { pregunta: "¿Cuál es la capital de Islas Salomón?", respuesta: "honiara" },
        { pregunta: "¿Cuál es la capital de Israel?", respuesta: "jerusalen" },
        { pregunta: "¿Cuál es la capital de Italia?", respuesta: "roma" },
        { pregunta: "¿Cuál es la capital de Jamaica?", respuesta: "kingston" },
        { pregunta: "¿Cuál es la capital de Japón?", respuesta: "tokio" },
        { pregunta: "¿Cuál es la capital de Jordania?", respuesta: "amán" },
        { pregunta: "¿Cuál es la capital de Kazajistán?", respuesta: "nur-sultan" }, // Anteriormente Astaná
        { pregunta: "¿Cuál es la capital de Kenia?", respuesta: "nairobi" },
        { pregunta: "¿Cuál es la capital de Kirguistán?", respuesta: "bishkek" },
        { pregunta: "¿Cuál es la capital de Kiribati?", respuesta: "tarawa" },
        { pregunta: "¿Cuál es la capital de Kuwait?", respuesta: "ciudad de kuwait" },
        { pregunta: "¿Cuál es la capital de Laos?", respuesta: "vientiane" },
        { pregunta: "¿Cuál es la capital de Lesoto?", respuesta: "maseru" },
        { pregunta: "¿Cuál es la capital de Letonia?", respuesta: "riga" },
        { pregunta: "¿Cuál es la capital de Líbano?", respuesta: "beirut" },
        { pregunta: "¿Cuál es la capital de Liberia?", respuesta: "monrovia" },
        { pregunta: "¿Cuál es la capital de Libia?", respuesta: "trípoli" },
        { pregunta: "¿Cuál es la capital de Liechtenstein?", respuesta: "vaduz" },
        { pregunta: "¿Cuál es la capital de Lituania?", respuesta: "vilnius" },
        { pregunta: "¿Cuál es la capital de Luxemburgo?", respuesta: "luxemburgo" },
        { pregunta: "¿Cuál es la capital de Macedonia del Norte?", respuesta: "skopie" },
        { pregunta: "¿Cuál es la capital de Madagascar?", respuesta: "antananarivo" },
        { pregunta: "¿Cuál es la capital de Malasia?", respuesta: "kuala lumpur" },
        { pregunta: "¿Cuál es la capital de Malaui?", respuesta: "lilongüe" },
        { pregunta: "¿Cuál es la capital de Maldivas?", respuesta: "malé" },
        { pregunta: "¿Cuál es la capital de Mali?", respuesta: "bamako" },
        { pregunta: "¿Cuál es la capital de Malta?", respuesta: "la valeta" },
        { pregunta: "¿Cuál es la capital de Marruecos?", respuesta: "rabat" },
        { pregunta: "¿Cuál es la capital de Mauricio?", respuesta: "port louis" },
        { pregunta: "¿Cuál es la capital de Mauritania?", respuesta: "nuakchot" },
        { pregunta: "¿Cuál es la capital de México?", respuesta: "ciudad de mexico" },
        { pregunta: "¿Cuál es la capital de Micronesia?", respuesta: "palikir" },
        { pregunta: "¿Cuál es la capital de Moldavia?", respuesta: "chisinau" },
        { pregunta: "¿Cuál es la capital de Mónaco?", respuesta: "mónaco" },
        { pregunta: "¿Cuál es la capital de Mongolia?", respuesta: "ulan bator" },
        { pregunta: "¿Cuál es la capital de Montenegro?", respuesta: "podgorica" },
        { pregunta: "¿Cuál es la capital de Mozambique?", respuesta: "maputo" },
        { pregunta: "¿Cuál es la capital de Namibia?", respuesta: "windhoek" },
        { pregunta: "¿Cuál es la capital de Nauru?", respuesta: "yaren" }, // Nota: Yaren es de facto, no tiene capital oficial
        { pregunta: "¿Cuál es la capital de Nepal?", respuesta: "katmandú" },
        { pregunta: "¿Cuál es la capital de Nicaragua?", respuesta: "managua" },
        { pregunta: "¿Cuál es la capital de Níger?", respuesta: "niamey" },
        { pregunta: "¿Cuál es la capital de Nigeria?", respuesta: "abuya" },
        { pregunta: "¿Cuál es la capital de Noruega?", respuesta: "oslo" },
        { pregunta: "¿Cuál es la capital de Nueva Zelanda?", respuesta: "wellington" },
        { pregunta: "¿Cuál es la capital de Omán?", respuesta: "mascate" },
        { pregunta: "¿Cuál es la capital de Países Bajos?", respuesta: "amsterdam" },
        { pregunta: "¿Cuál es la capital de Pakistán?", respuesta: "islamabad" },
        { pregunta: "¿Cuál es la capital de Palaos?", respuesta: "ngerulmud" },
        { pregunta: "¿Cuál es la capital de Panamá?", respuesta: "ciudad de panama" },
        { pregunta: "¿Cuál es la capital de Papúa Nueva Guinea?", respuesta: "port moresby" },
        { pregunta: "¿Cuál es la capital de Paraguay?", respuesta: "asuncion" },
        { pregunta: "¿Cuál es la capital de Perú?", respuesta: "lima" },
        { pregunta: "¿Cuál es la capital de Polonia?", respuesta: "varsovia" },
        { pregunta: "¿Cuál es la capital de Portugal?", respuesta: "lisboa" },
        { pregunta: "¿Cuál es la capital de Reino Unido?", respuesta: "londres" },
        { pregunta: "¿Cuál es la capital de República Centroafricana?", respuesta: "bangui" },
        { pregunta: "¿Cuál es la capital de República Checa?", respuesta: "praga" },
        { pregunta: "¿Cuál es la capital de República del Congo?", respuesta: "brazzaville" },
        { pregunta: "¿Cuál es la capital de República Democrática del Congo?", respuesta: "kinshasa" },
        { pregunta: "¿Cuál es la capital de República Dominicana?", respuesta: "santo domingo" },
        { pregunta: "¿Cuál es la capital de Ruanda?", respuesta: "kigali" },
        { pregunta: "¿Cuál es la capital de Rumanía?", respuesta: "bucarest" },
        { pregunta: "¿Cuál es la capital de Rusia?", respuesta: "moscu" },
        { pregunta: "¿Cuál es la capital de Samoa?", respuesta: "apia" },
        { pregunta: "¿Cuál es la capital de San Cristóbal y Nieves?", respuesta: "basseterre" },
        { pregunta: "¿Cuál es la capital de San Marino?", respuesta: "san marino" },
        { pregunta: "¿Cuál es la capital de San Vicente y las Granadinas?", respuesta: "kingstown" },
        { pregunta: "¿Cuál es la capital de Santa Lucía?", respuesta: "castries" },
        { pregunta: "¿Cuál es la capital de Santo Tomé y Príncipe?", respuesta: "santo tome" },
        { pregunta: "¿Cuál es la capital de Senegal?", respuesta: "dakar" },
        { pregunta: "¿Cuál es la capital de Serbia?", respuesta: "belgrado" },
        { pregunta: "¿Cuál es la capital de Seychelles?", respuesta: "victoria" },
        { pregunta: "¿Cuál es la capital de Sierra Leona?", respuesta: "freetown" },
        { pregunta: "¿Cuál es la capital de Singapur?", respuesta: "singapur" },
        { pregunta: "¿Cuál es la capital de Siria?", respuesta: "damasco" },
        { pregunta: "¿Cuál es la capital de Somalia?", respuesta: "mogadiscio" },
        { pregunta: "¿Cuál es la capital de Sri Lanka?", respuesta: "colombo" }, // Nota: Sri Jayawardenepura Kotte es la capital legislativa
        { pregunta: "¿Cuál es la capital de Sudáfrica?", respuesta: "pretoria" }, // Nota: Tiene tres capitales, pero Pretoria es la administrativa
        { pregunta: "¿Cuál es la capital de Sudán?", respuesta: "jartum" },
        { pregunta: "¿Cuál es la capital de Sudán del Sur?", respuesta: "yuba" },
        { pregunta: "¿Cuál es la capital de Suecia?", respuesta: "estocolmo" },
        { pregunta: "¿Cuál es la capital de Suiza?", respuesta: "berna" },
        { pregunta: "¿Cuál es la capital de Surinam?", respuesta: "paramaribo" },
        { pregunta: "¿Cuál es la capital de Tailandia?", respuesta: "bangkok" },
        { pregunta: "¿Cuál es la capital de Taiwán?", respuesta: "taipei" }, // Nota: Reconocido como país por algunos
        { pregunta: "¿Cuál es la capital de Tanzania?", respuesta: "dodoma" },
        { pregunta: "¿Cuál es la capital de Tayikistán?", respuesta: "dusanbe" },
        { pregunta: "¿Cuál es la capital de Timor Oriental?", respuesta: "dili" },
        { pregunta: "¿Cuál es la capital de Togo?", respuesta: "lomé" },
        { pregunta: "¿Cuál es la capital de Tonga?", respuesta: "nukualofa" },
        { pregunta: "¿Cuál es la capital de Trinidad y Tobago?", respuesta: "puerto españa" },
        { pregunta: "¿Cuál es la capital de Túnez?", respuesta: "tunez" },
        { pregunta: "¿Cuál es la capital de Turquía?", respuesta: "ankara" },
        { pregunta: "¿Cuál es la capital de Turkmenistán?", respuesta: "ashjabad" },
        { pregunta: "¿Cuál es la capital de Tuvalu?", respuesta: "funafuti" },
        { pregunta: "¿Cuál es la capital de Ucrania?", respuesta: "kiev" },
        { pregunta: "¿Cuál es la capital de Uganda?", respuesta: "kampala" },
        { pregunta: "¿Cuál es la capital de Uruguay?", respuesta: "montevideo" },
        { pregunta: "¿Cuál es la capital de Uzbekistán?", respuesta: "taskent" },
        { pregunta: "¿Cuál es la capital de Vanuatu?", respuesta: "port vila" },
        { pregunta: "¿Cuál es la capital de Venezuela?", respuesta: "caracas" },
        { pregunta: "¿Cuál es la capital de Vietnam?", respuesta: "hanoi" },
        { pregunta: "¿Cuál es la capital de Yemen?", respuesta: "saná" },
        { pregunta: "¿Cuál es la capital de Yibuti?", respuesta: "yibuti" },
        { pregunta: "¿Cuál es la capital de Zambia?", respuesta: "lusaka" },
        { pregunta: "¿Cuál es la capital de Zimbabue?", respuesta: "harare" }
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
        { pregunta: "¿Qué elemento tiene el símbolo 'P'?", respuesta: "fósforo" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Cl'?", respuesta: "cloro" },
        { pregunta: "¿Qué metal tiene el símbolo 'Zn'?", respuesta: "zinc" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Mg'?", respuesta: "magnesio" },
        { pregunta: "¿Qué gas noble tiene el símbolo 'Kr'?", respuesta: "kriptón" },
        { pregunta: "¿Qué compuesto es el metano?", respuesta: "ch4" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Si'?", respuesta: "silicio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Sn'?", respuesta: "estaño" },
        { pregunta: "¿Qué elemento tiene el símbolo 'F'?", respuesta: "flúor" },
        { pregunta: "¿Qué compuesto es el amoníaco?", respuesta: "nh3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ca'?", respuesta: "calcio" },
        { pregunta: "¿Qué gas noble tiene el símbolo 'Xe'?", respuesta: "xenón" },
        { pregunta: "¿Qué metal tiene el símbolo 'Ni'?", respuesta: "níquel" },
        { pregunta: "¿Qué elemento tiene el símbolo 'B'?", respuesta: "boro" },
        { pregunta: "¿Qué compuesto es el ácido sulfúrico?", respuesta: "h2so4" },
        { pregunta: "¿Qué elemento tiene el símbolo 'I'?", respuesta: "yodo" },
        { pregunta: "¿Qué metal tiene el símbolo 'Ti'?", respuesta: "titanio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Br'?", respuesta: "bromo" },
        { pregunta: "¿Qué compuesto es el óxido nitroso?", respuesta: "n2o" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Li'?", respuesta: "litio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Cr'?", respuesta: "cromo" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Be'?", respuesta: "berilio" },
        { pregunta: "¿Qué compuesto es el etanol?", respuesta: "c2h5oh" },
        { pregunta: "¿Qué gas noble tiene el símbolo 'Rn'?", respuesta: "radón" },
        { pregunta: "¿Qué elemento tiene el símbolo 'As'?", respuesta: "arsénico" },
        { pregunta: "¿Qué metal tiene el símbolo 'Mn'?", respuesta: "manganeso" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Se'?", respuesta: "selenio" },
        { pregunta: "¿Qué compuesto es el peróxido de hidrógeno?", respuesta: "h2o2" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Sr'?", respuesta: "estroncio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Co'?", respuesta: "cobalto" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ba'?", respuesta: "bario" },
        { pregunta: "¿Qué compuesto es el ácido clorhídrico?", respuesta: "hcl" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ge'?", respuesta: "germanio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Pt'?", respuesta: "platino" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Rb'?", respuesta: "rubidio" },
        { pregunta: "¿Qué compuesto es el bicarbonato de sodio?", respuesta: "nahco3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Cs'?", respuesta: "cesio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Pd'?", respuesta: "paladio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ga'?", respuesta: "galio" },
        { pregunta: "¿Qué compuesto es el óxido de calcio?", respuesta: "cao" },
        { pregunta: "¿Qué elemento tiene el símbolo 'In'?", respuesta: "indio" },
        { pregunta: "¿Qué metal tiene el símbolo 'W'?", respuesta: "tungsteno" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Sb'?", respuesta: "antimonio" },
        { pregunta: "¿Qué compuesto es el sulfato de cobre?", respuesta: "cuso4" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Te'?", respuesta: "telurio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Mo'?", respuesta: "molibdeno" },
        { pregunta: "¿Qué elemento tiene el símbolo 'V'?", respuesta: "vanadio" },
        { pregunta: "¿Qué compuesto es el cloruro de calcio?", respuesta: "cacl2" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Bi'?", respuesta: "bismuto" },
        { pregunta: "¿Qué metal tiene el símbolo 'Rh'?", respuesta: "rodio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Tl'?", respuesta: "talio" },
        { pregunta: "¿Qué compuesto es el nitrato de potasio?", respuesta: "kno3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'U'?", respuesta: "uranio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Ir'?", respuesta: "iridio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Th'?", respuesta: "torio" },
        { pregunta: "¿Qué compuesto es el carbonato de calcio?", respuesta: "caco3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Pu'?", respuesta: "plutonio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Os'?", respuesta: "osmio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ac'?", respuesta: "actinio" },
        { pregunta: "¿Qué compuesto es el fosfato de sodio?", respuesta: "na3po4" },
        { pregunta: "¿Qué elemento tiene el símbolo 'La'?", respuesta: "lantano" },
        { pregunta: "¿Qué metal tiene el símbolo 'Ru'?", respuesta: "ruteno" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ce'?", respuesta: "cerio" },
        { pregunta: "¿Qué compuesto es el hidróxido de sodio?", respuesta: "naoh" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Pr'?", respuesta: "praseodimio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Re'?", respuesta: "renio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Nd'?", respuesta: "neodimio" },
        { pregunta: "¿Qué compuesto es el sulfuro de hidrógeno?", respuesta: "h2s" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Pm'?", respuesta: "prometio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Ta'?", respuesta: "tántalo" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Sm'?", respuesta: "samario" },
        { pregunta: "¿Qué compuesto es el cloruro de magnesio?", respuesta: "mgcl2" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Eu'?", respuesta: "europio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Hf'?", respuesta: "hafnio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Gd'?", respuesta: "gadolinio" },
        { pregunta: "¿Qué compuesto es el óxido de hierro?", respuesta: "fe2o3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Tb'?", respuesta: "terbio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Nb'?", respuesta: "niobio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Dy'?", respuesta: "disprosio" },
        { pregunta: "¿Qué compuesto es el acetato de sodio?", respuesta: "ch3coona" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ho'?", respuesta: "holmio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Zr'?", respuesta: "zirconio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Er'?", respuesta: "erbio" },
        { pregunta: "¿Qué compuesto es el sulfato de magnesio?", respuesta: "mgso4" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Tm'?", respuesta: "tulio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Y'?", respuesta: "itrio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Yb'?", respuesta: "iterbio" },
        { pregunta: "¿Qué compuesto es el nitrato de amonio?", respuesta: "nh4no3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Lu'?", respuesta: "lutecio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Sc'?", respuesta: "escandio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'At'?", respuesta: "astato" },
        { pregunta: "¿Qué compuesto es el óxido de magnesio?", respuesta: "mgo" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Po'?", respuesta: "polonio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Cd'?", respuesta: "cadmio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Fr'?", respuesta: "francio" },
        { pregunta: "¿Qué compuesto es el clorato de potasio?", respuesta: "kclo3" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Ra'?", respuesta: "radio" },
        { pregunta: "¿Qué metal tiene el símbolo 'Hg'?", respuesta: "mercurio" },
        { pregunta: "¿Qué elemento tiene el símbolo 'Rf'?", respuesta: "rutherfordio" },
        { pregunta: "¿Qué compuesto es el fosfato de calcio?", respuesta: "ca3(po4)2" }
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
        { pregunta: "¿Qué ley dice que a toda acción hay una reacción igual y opuesta?", respuesta: "tercera ley de newton" },
        { pregunta: "¿Qué mide la unidad 'candela'?", respuesta: "intensidad luminosa" },
        { pregunta: "¿Qué instrumento mide la humedad del aire?", respuesta: "higrómetro" },
        { pregunta: "¿Qué tipo de energía tiene un objeto en altura?", respuesta: "potencial" },
        { pregunta: "¿Qué ley dice que un objeto en reposo sigue en reposo?", respuesta: "primera ley de newton" },
        { pregunta: "¿Qué mide la unidad 'kelvin'?", respuesta: "temperatura" },
        { pregunta: "¿Qué fenómeno explica el arcoíris?", respuesta: "refracción" },
        { pregunta: "¿Qué instrumento mide la radiación?", respuesta: "contador geiger" },
        { pregunta: "¿Qué tipo de onda es la luz?", respuesta: "transversal" },
        { pregunta: "¿Qué mide la unidad 'pascal'?", respuesta: "presión" },
        { pregunta: "¿Quién descubrió la ley de la gravitación universal?", respuesta: "newton" },
        { pregunta: "¿Qué mide la unidad 'tesla'?", respuesta: "campo magnético" },
        { pregunta: "¿Qué fenómeno explica la dilatación del tiempo?", respuesta: "relatividad especial" },
        { pregunta: "¿Qué instrumento mide la distancia recorrida?", respuesta: "odómetro" },
        { pregunta: "¿Qué tipo de energía produce el sol?", respuesta: "nuclear" },
        { pregunta: "¿Qué mide la unidad 'lumen'?", respuesta: "flujo luminoso" },
        { pregunta: "¿Qué mide la unidad 'lux'?", respuesta: "iluminancia" },
        { pregunta: "¿Qué instrumento mide la masa?", respuesta: "balanza" },
        { pregunta: "¿Qué tipo de energía usa una batería?", respuesta: "química" },
        { pregunta: "¿Qué fenómeno explica la dispersión de la luz?", respuesta: "difracción" },
        { pregunta: "¿Qué mide la unidad 'weber'?", respuesta: "flujo magnético" },
        { pregunta: "¿Qué instrumento mide el tiempo?", respuesta: "reloj" },
        { pregunta: "¿Qué tipo de energía es el calor?", respuesta: "térmica" },
        { pregunta: "¿Qué fenómeno explica el efecto Doppler?", respuesta: "cambio de frecuencia" },
        { pregunta: "¿Qué mide la unidad 'sievert'?", respuesta: "dosis de radiación" },
        { pregunta: "¿Qué instrumento mide la intensidad del sonido?", respuesta: "sonómetro" },
        { pregunta: "¿Qué tipo de energía usa un panel solar?", respuesta: "solar" },
        { pregunta: "¿Qué fenómeno explica la reflexión?", respuesta: "rebote de luz" },
        { pregunta: "¿Qué mide la unidad 'faradio'?", respuesta: "capacitancia" },
        { pregunta: "¿Qué instrumento mide la electricidad estática?", respuesta: "electroscopio" },
        { pregunta: "¿Qué tipo de energía almacena un imán?", respuesta: "magnética" },
        { pregunta: "¿Qué fenómeno explica la superconductividad?", respuesta: "resistencia cero" },
        { pregunta: "¿Qué mide la unidad 'henry'?", respuesta: "inductancia" },
        { pregunta: "¿Qué instrumento mide la densidad?", respuesta: "densímetro" },
        { pregunta: "¿Qué tipo de energía usa un motor?", respuesta: "mecánica" },
        { pregunta: "¿Qué fenómeno explica la interferencia?", respuesta: "superposición de ondas" },
        { pregunta: "¿Qué mide la unidad 'gray'?", respuesta: "dosis absorbida" },
        { pregunta: "¿Qué instrumento mide la altitud?", respuesta: "altímetro" },
        { pregunta: "¿Qué tipo de energía tiene el viento?", respuesta: "eólica" },
        { pregunta: "¿Qué fenómeno explica la polarización?", respuesta: "orientación de ondas" },
        { pregunta: "¿Qué mide la unidad 'becquerel'?", respuesta: "actividad radiactiva" },
        { pregunta: "¿Qué instrumento mide el flujo de agua?", respuesta: "caudalímetro" },
        { pregunta: "¿Qué tipo de energía usa una central hidroeléctrica?", respuesta: "hidráulica" },
        { pregunta: "¿Qué fenómeno explica el efecto fotoeléctrico?", respuesta: "emisión de electrones" },
        { pregunta: "¿Qué mide la unidad 'sievert'?", respuesta: "dosis equivalente" },
        { pregunta: "¿Qué instrumento mide la velocidad?", respuesta: "velocímetro" },
        { pregunta: "¿Qué tipo de energía tiene una ola?", respuesta: "mareomotriz" },
        { pregunta: "¿Qué fenómeno explica la resonancia?", respuesta: "vibración amplificada" },
        { pregunta: "¿Qué mide la unidad 'coulomb'?", respuesta: "carga eléctrica" },
        { pregunta: "¿Qué instrumento mide la presión de un gas?", respuesta: "manómetro" },
        { pregunta: "¿Qué tipo de energía usa un reactor nuclear?", respuesta: "nuclear" },
        { pregunta: "¿Qué fenómeno explica la radiación?", respuesta: "emisión de partículas" },
        { pregunta: "¿Qué mide la unidad 'newton metro'?", respuesta: "torque" },
        { pregunta: "¿Qué instrumento mide la luz?", respuesta: "fotómetro" },
        { pregunta: "¿Qué tipo de energía tiene un rayo?", respuesta: "eléctrica" },
        { pregunta: "¿Qué fenómeno explica la flotación?", respuesta: "principio de arquímedes" },
        { pregunta: "¿Qué mide la unidad 'radian'?", respuesta: "ángulo" },
        { pregunta: "¿Qué instrumento mide la aceleración?", respuesta: "acelerómetro" },
        { pregunta: "¿Qué tipo de energía usa un géiser?", respuesta: "geotérmica" },
        { pregunta: "¿Qué fenómeno explica la capilaridad?", respuesta: "tensión superficial" },
        { pregunta: "¿Qué mide la unidad 'steradian'?", respuesta: "ángulo sólido" },
        { pregunta: "¿Qué instrumento mide la viscosidad?", respuesta: "viscosímetro" },
        { pregunta: "¿Qué tipo de energía tiene un terremoto?", respuesta: "sísmica" },
        { pregunta: "¿Qué fenómeno explica la inercia?", respuesta: "resistencia al cambio" },
        { pregunta: "¿Qué mide la unidad 'mol'?", respuesta: "cantidad de sustancia" },
        { pregunta: "¿Qué instrumento mide la inclinación?", respuesta: "inclinómetro" },
        { pregunta: "¿Qué tipo de energía usa un cohete?", respuesta: "química" },
        { pregunta: "¿Qué fenómeno explica la evaporación?", respuesta: "cambio de estado" }
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
        { pregunta: "¿Quién fue el faraón famoso por su tumba llena de tesoros?", respuesta: "tutankamón" },
        { pregunta: "¿En qué año comenzó la Revolución Industrial?", respuesta: "1760" },
        { pregunta: "¿Qué civilización construyó el Coliseo?", respuesta: "romana" },
        { pregunta: "¿Quién fue el primer hombre en pisar la Luna?", respuesta: "neil armstrong" },
        { pregunta: "¿En qué año se descubrió América del Norte por los vikingos?", respuesta: "1000" },
        { pregunta: "¿Qué guerra duró 100 años?", respuesta: "guerra de los cien años" },
        { pregunta: "¿Quién inventó la bombilla?", respuesta: "edison" },
        { pregunta: "¿En qué año se fundó la ONU?", respuesta: "1945" },
        { pregunta: "¿Qué civilización creó los Juegos Olímpicos?", respuesta: "griega" },
        { pregunta: "¿Quién fue la primera mujer en ganar un Nobel?", respuesta: "marie curie" },
        { pregunta: "¿En qué año se abolió la esclavitud en EE.UU.?", respuesta: "1865" },
        { pregunta: "¿Qué imperio construyó la Gran Muralla?", respuesta: "chino" },
        { pregunta: "¿Quién fue el líder de la independencia de India?", respuesta: "gandhi" },
        { pregunta: "¿En qué año ocurrió la Revolución de Octubre?", respuesta: "1917" },
        { pregunta: "¿Qué evento marcó el fin de la Segunda Guerra Mundial en Europa?", respuesta: "día de la victoria" },
        { pregunta: "¿En qué año se descubrió el fuego?", respuesta: "prehistoria" },
        { pregunta: "¿Qué civilización construyó Chichén Itzá?", respuesta: "maya" },
        { pregunta: "¿Quién fue el primer emperador de Francia?", respuesta: "napoleón" },
        { pregunta: "¿En qué año se inventó el teléfono?", respuesta: "1876" },
        { pregunta: "¿Qué guerra tuvo lugar entre 1861 y 1865 en EE.UU.?", respuesta: "guerra civil" },
        { pregunta: "¿Quién descubrió la teoría de la evolución?", respuesta: "darwin" },
        { pregunta: "¿En qué año se firmó el Tratado de Versalles?", respuesta: "1919" },
        { pregunta: "¿Qué civilización inventó el papel?", respuesta: "china" },
        { pregunta: "¿Quién fue el líder de la Revolución Cubana?", respuesta: "fidel castro" },
        { pregunta: "¿En qué año se inventó el automóvil?", respuesta: "1886" },
        { pregunta: "¿Qué reina fue conocida como la Virgen?", respuesta: "isabel i" },
        { pregunta: "¿Qué evento marcó el inicio de la Segunda Guerra Mundial?", respuesta: "invasión de polonia" },
        { pregunta: "¿Quién inventó la máquina de vapor?", respuesta: "watt" },
        { pregunta: "¿En qué año se descubrió la electricidad?", respuesta: "1752" },
        { pregunta: "¿Qué civilización construyó Stonehenge?", respuesta: "neolítica" },
        { pregunta: "¿Quién fue el último zar de Rusia?", respuesta: "nicolás ii" },
        { pregunta: "¿En qué año se lanzó el primer satélite?", respuesta: "1957" },
        { pregunta: "¿Qué guerra enfrentó a Esparta y Atenas?", respuesta: "guerra del peloponeso" },
        { pregunta: "¿Quién descubrió América del Sur?", respuesta: "colón" },
        { pregunta: "¿En qué año se inventó la televisión?", respuesta: "1927" },
        { pregunta: "¿Qué reina gobernó España durante el descubrimiento de América?", respuesta: "isabel la católica" },
        { pregunta: "¿Qué evento marcó el fin del apartheid?", respuesta: "liberación de mandela" },
        { pregunta: "¿Quién inventó el telégrafo?", respuesta: "morse" },
        { pregunta: "¿En qué año se descubrió Australia?", respuesta: "1606" },
        { pregunta: "¿Qué civilización inventó el alfabeto?", respuesta: "fenicia" },
        { pregunta: "¿Quién fue el líder de los nazis?", respuesta: "hitler" },
        { pregunta: "¿En qué año se fundó Roma?", respuesta: "753 ac" },
        { pregunta: "¿Qué guerra tuvo lugar en Vietnam entre 1955 y 1975?", respuesta: "guerra de vietnam" },
        { pregunta: "¿Quién descubrió la radiactividad?", respuesta: "becquerel" },
        { pregunta: "¿En qué año se inventó el avión?", respuesta: "1903" },
        { pregunta: "¿Qué reina fue ejecutada en la Revolución Francesa?", respuesta: "maría antonieta" },
        { pregunta: "¿Qué evento marcó el inicio del Renacimiento?", respuesta: "caída de constantinopla" },
        { pregunta: "¿Quién inventó la rueda?", respuesta: "mesopotamia" },
        { pregunta: "¿En qué año se descubrió el ADN?", respuesta: "1953" },
        { pregunta: "¿Qué civilización inventó la pólvora?", respuesta: "china" },
        { pregunta: "¿Quién fue el primer presidente de Rusia?", respuesta: "yeltsin" },
        { pregunta: "¿En qué año se inventó la computadora?", respuesta: "1946" },
        { pregunta: "¿Qué rey firmó la Magna Carta?", respuesta: "juan sin tierra" },
        { pregunta: "¿Qué evento marcó el fin de la Guerra Fría?", respuesta: "caída del muro de berlín" },
        { pregunta: "¿Quién descubrió el Nuevo Mundo?", respuesta: "colón" },
        { pregunta: "¿En qué año se inventó la fotografía?", respuesta: "1839" },
        { pregunta: "¿Qué civilización construyó las líneas de Nazca?", respuesta: "nazca" },
        { pregunta: "¿Quién fue el líder de la Revolución Americana?", respuesta: "washington" }
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
        { pregunta: "¿Qué órgano humano es el más grande?", respuesta: "piel" },
        { pregunta: "¿Qué animal tiene rayas negras y blancas?", respuesta: "cebra" },
        { pregunta: "¿Qué parte de la planta produce semillas?", respuesta: "flor" },
        { pregunta: "¿Qué animal es el más rápido en tierra?", respuesta: "guepardo" },
        { pregunta: "¿Qué órgano humano controla el sistema nervioso?", respuesta: "cerebro" },
        { pregunta: "¿Qué proceso convierte el azúcar en energía?", respuesta: "respiración celular" },
        { pregunta: "¿Qué animal tiene trompa y colmillos?", respuesta: "elefante" },
        { pregunta: "¿Qué parte del cuerpo humano produce glóbulos rojos?", respuesta: "médula ósea" },
        { pregunta: "¿Qué animal es conocido por su caparazón?", respuesta: "tortuga" },
        { pregunta: "¿Qué gas liberan las plantas durante la fotosíntesis?", respuesta: "oxígeno" },
        { pregunta: "¿Qué animal tiene un cuerno en la nariz?", respuesta: "rinoceronte" },
        { pregunta: "¿Qué parte de la célula produce energía?", respuesta: "mitocondria" },
        { pregunta: "¿Qué insecto transmite la malaria?", respuesta: "mosquito" },
        { pregunta: "¿Qué animal es el ave más grande?", respuesta: "avestruz" },
        { pregunta: "¿Qué proceso permite a los animales reproducirse?", respuesta: "fertilización" },
        { pregunta: "¿Qué animal tiene una melena?", respuesta: "león" },
        { pregunta: "¿Qué parte de la planta transporta nutrientes?", respuesta: "tallo" },
        { pregunta: "¿Qué animal es conocido por su cola prensil?", respuesta: "mono" },
        { pregunta: "¿Qué órgano humano filtra el aire?", respuesta: "pulmones" },
        { pregunta: "¿Qué proceso permite a las plantas crecer?", respuesta: "crecimiento celular" },
        { pregunta: "¿Qué animal tiene alas pero no vuela?", respuesta: "gallina" },
        { pregunta: "¿Qué parte del cuerpo humano detecta el olor?", respuesta: "nariz" },
        { pregunta: "¿Qué animal es conocido por su veneno mortal?", respuesta: "serpiente" },
        { pregunta: "¿Qué gas usan los peces para respirar?", respuesta: "oxígeno" },
        { pregunta: "¿Qué parte de la planta protege las semillas?", respuesta: "fruto" },
        { pregunta: "¿Qué animal tiene garras retráctiles?", respuesta: "gato" },
        { pregunta: "¿Qué órgano humano regula la temperatura?", respuesta: "piel" },
        { pregunta: "¿Qué proceso permite a las aves migrar?", respuesta: "instinto" },
        { pregunta: "¿Qué animal tiene un pico largo para pescar?", respuesta: "pelícano" },
        { pregunta: "¿Qué parte del cuerpo humano ve los colores?", respuesta: "ojos" },
        { pregunta: "¿Qué animal es conocido por su cola de castor?", respuesta: "castor" },
        { pregunta: "¿Qué gas causa el efecto invernadero?", respuesta: "dióxido de carbono" },
        { pregunta: "¿Qué parte de la célula almacena agua?", respuesta: "vacuola" },
        { pregunta: "¿Qué animal tiene un cuello con manchas?", respuesta: "jirafa" },
        { pregunta: "¿Qué órgano humano produce bilis?", respuesta: "hígado" },
        { pregunta: "¿Qué proceso permite a los reptiles mudar piel?", respuesta: "ecdysis" },
        { pregunta: "¿Qué animal tiene un caparazón con púas?", respuesta: "erizo" },
        { pregunta: "¿Qué parte del cuerpo humano detecta el sabor?", respuesta: "lengua" }
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
        { pregunta: "¿Qué juego incluye combates con cartas como 'Magic'?", respuesta: "hearthstone" },
        { pregunta: "¿Qué juego tiene un personaje llamado Ezio Auditore?", respuesta: "assassin's creed" },
        { pregunta: "¿Qué juego incluye un mundo con portales naranjas y azules?", respuesta: "portal" },
        { pregunta: "¿Qué juego te deja explorar Hyrule con Breath of the Wild?", respuesta: "the legend of zelda breath of the wild" },
        { pregunta: "¿Qué juego tiene un personaje llamado Doom Slayer?", respuesta: "doom" },
        { pregunta: "¿Qué juego es famoso por su modo Among Us?", respuesta: "among us" },
        { pregunta: "¿Qué juego tiene un mundo con islas flotantes llamado Skylands?", respuesta: "skylanders" },
        { pregunta: "¿Qué juego incluye a un personaje llamado Samus Aran?", respuesta: "metroid" },
        { pregunta: "¿Qué juego tiene un modo de construcción llamado Creative?", respuesta: "minecraft" },
        { pregunta: "¿Qué juego incluye a un personaje llamado Aloy?", respuesta: "horizon zero dawn" },
        { pregunta: "¿Qué juego tiene un mundo con dragones llamado Tamriel?", respuesta: "skyrim" },
        { pregunta: "¿Qué juego te permite pelear con Pikachu?", respuesta: "super smash bros" },
        { pregunta: "¿Qué juego tiene un personaje llamado Niko Bellic?", respuesta: "grand theft auto iv" },
        { pregunta: "¿Qué juego incluye un modo de supervivencia en una isla?", respuesta: "ark survival evolved" },
        { pregunta: "¿Qué juego tiene un personaje llamado Cloud Strife?", respuesta: "final fantasy vii" },
        { pregunta: "¿Qué juego incluye un mundo con máquinas gigantes?", respuesta: "horizon forbidden west" },
        { pregunta: "¿Qué juego te deja conducir en Night City?", respuesta: "cyberpunk 2077" },
        { pregunta: "¿Qué juego tiene un personaje llamado Nathan Drake?", respuesta: "uncharted" },
        { pregunta: "¿Qué juego es famoso por su modo Battlegrounds?", respuesta: "pubg" },
        { pregunta: "¿Qué juego tiene un mundo con dioses nórdicos?", respuesta: "god of war ragnarok" },
        { pregunta: "¿Qué juego incluye a un personaje llamado Ryu?", respuesta: "street fighter" },
        { pregunta: "¿Qué juego tiene un modo de zombies famoso?", respuesta: "call of duty black ops" },
        { pregunta: "¿Qué juego te permite explorar Rapture?", respuesta: "bioshock" },
        { pregunta: "¿Qué juego tiene un personaje llamado Bayonetta?", respuesta: "bayonetta" }
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
        { pregunta: "¿Qué película tiene un personaje llamado Hannibal Lecter?", respuesta: "el silencio de los corderos" },
        { pregunta: "¿Qué película tiene un león llamado Simba?", respuesta: "el rey león" },
        { pregunta: "¿Qué película incluye un viaje en el tiempo con un DeLorean?", respuesta: "volver al futuro" },
        { pregunta: "¿Qué película tiene un personaje llamado Bruce Wayne?", respuesta: "batman" },
        { pregunta: "¿Qué película incluye un planeta llamado Pandora?", respuesta: "avatar" },
        { pregunta: "¿Qué película tiene un personaje llamado John Wick?", respuesta: "john wick" },
        { pregunta: "¿Qué película incluye un mundo con dinosaurios revividos?", respuesta: "jurassic park" },
        { pregunta: "¿Qué película tiene un personaje llamado Woody?", respuesta: "toy story" },
        { pregunta: "¿Qué película incluye un superhéroe con un martillo llamado Mjölnir?", respuesta: "thor" },
        { pregunta: "¿Qué película tiene un personaje llamado Shrek?", respuesta: "shrek" },
        { pregunta: "¿Qué película incluye una escuela de mutantes?", respuesta: "x-men" },
        { pregunta: "¿Qué película tiene un personaje llamado Neo?", respuesta: "matrix" },
        { pregunta: "¿Qué película incluye un viaje al centro de la Tierra?", respuesta: "viaje al centro de la tierra" },
        { pregunta: "¿Qué película tiene un personaje llamado Elsa con poderes de hielo?", respuesta: "frozen" },
        { pregunta: "¿Qué película tiene un personaje llamado Simba como adulto?", respuesta: "el rey león 2" },
        { pregunta: "¿Qué película incluye un mundo con juguetes vivientes?", respuesta: "toy story" },
        { pregunta: "¿Qué película tiene un personaje llamado Luke Skywalker?", respuesta: "star wars" },
        { pregunta: "¿Qué película incluye un superhéroe con garras de adamantium?", respuesta: "wolverine" },
        { pregunta: "¿Qué película tiene un personaje llamado Katniss Everdeen?", respuesta: "los juegos del hambre" },
        { pregunta: "¿Qué película incluye un mundo con máquinas rebeldes?", respuesta: "terminator" },
        { pregunta: "¿Qué película tiene un personaje llamado Marty McFly?", respuesta: "volver al futuro" }
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
        { pregunta: "¿Qué película Disney tiene un elefante con orejas grandes?", respuesta: "dumbo" },
        { pregunta: "¿Qué princesa Disney duerme por un hechizo?", respuesta: "aurora" },
        { pregunta: "¿Qué película Disney tiene un gato llamado Cheshire?", respuesta: "alicia en el país de las maravillas" },
        { pregunta: "¿Qué personaje Disney es un pato con suerte?", respuesta: "pato donald" },
        { pregunta: "¿Qué película Disney tiene un ciervo llamado Bambi?", respuesta: "bambi" },
        { pregunta: "¿Qué princesa Disney tiene un cabello muy largo?", respuesta: "rapunzel" },
        { pregunta: "¿Qué película Disney incluye un tigre llamado Rajah?", respuesta: "aladdín" },
        { pregunta: "¿Qué personaje Disney es un perro fiel?", respuesta: "pluto" },
        { pregunta: "¿Qué película Disney tiene un jabalí llamado Pumba?", respuesta: "el rey león" },
        { pregunta: "¿Qué princesa Disney usa un arco y flecha?", respuesta: "mérida" },
        { pregunta: "¿Qué película Disney tiene un conejo blanco?", respuesta: "alicia en el país de las maravillas" },
        { pregunta: "¿Qué personaje Disney es un ganso torpe?", respuesta: "goofy" },
        { pregunta: "¿Qué película Disney incluye un cocodrilo que hace tic-tac?", respuesta: "peter pan" },
        { pregunta: "¿Qué princesa Disney se disfraza de hombre para pelear?", respuesta: "mulán" },
        { pregunta: "¿Qué película Disney tiene un zorro llamado Robin Hood?", respuesta: "robin hood" },
        { pregunta: "¿Qué personaje Disney es un grillo consejero?", respuesta: "pepe grillo" },
        { pregunta: "¿Qué película Disney incluye un mapache llamado Meeko?", respuesta: "pocahontas" },
        { pregunta: "¿Qué princesa Disney ama los libros?", respuesta: "bella" },
        { pregunta: "¿Qué película Disney tiene un cachorro llamado Bolt?", respuesta: "bolt" },
        { pregunta: "¿Qué personaje Disney es un mono amigo de Aladdín?", respuesta: "abu" },
        { pregunta: "¿Qué película Disney tiene un pájaro llamado Zazu?", respuesta: "el rey león" },
        { pregunta: "¿Qué princesa Disney tiene un zapato de cristal?", respuesta: "cenicienta" },
        { pregunta: "¿Qué película Disney incluye un dragón llamado Mushu?", respuesta: "mulán" },
        { pregunta: "¿Qué personaje Disney es un ratón detective?", respuesta: "basil" },
        { pregunta: "¿Qué película Disney tiene un pez llamado Dory?", respuesta: "buscando a dory" },
        { pregunta: "¿Qué princesa Disney tiene un vestido azul?", respuesta: "cenicienta" },
        { pregunta: "¿Qué película Disney incluye un genio azul?", respuesta: "aladdín" },
        { pregunta: "¿Qué personaje Disney es un búho sabio?", respuesta: "archimedes" },
        { pregunta: "¿Qué película Disney tiene un cachorro llamado 101?", respuesta: "101 dálmatas" },
        { pregunta: "¿Qué princesa Disney canta con animales?", respuesta: "blancanieves" }
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
        { pregunta: "¿Cuánto es 100 ÷ 10?", respuesta: "10" },
        { pregunta: "¿Cuánto es 13 + 7?", respuesta: "20" },
        { pregunta: "¿Cuál es el resultado de 6 x 6?", respuesta: "36" },
        { pregunta: "¿Cuánto es 40 - 15?", respuesta: "25" },
        { pregunta: "¿Qué número es el doble de 12?", respuesta: "24" },
        { pregunta: "¿Cuánto es 18 ÷ 3?", respuesta: "6" },
        { pregunta: "¿Cuál es el resultado de 14 + 9?", respuesta: "23" },
        { pregunta: "¿Qué número es la mitad de 16?", respuesta: "8" },
        { pregunta: "¿Cuánto es 5 x 9?", respuesta: "45" },
        { pregunta: "¿Cuál es el resultado de 33 - 17?", respuesta: "16" },
        { pregunta: "¿Cuánto es 7 + 13?", respuesta: "20" },
        { pregunta: "¿Cuál es el resultado de 8 x 5?", respuesta: "40" },
        { pregunta: "¿Cuánto es 24 - 12?", respuesta: "12" },
        { pregunta: "¿Qué número es el triple de 4?", respuesta: "12" },
        { pregunta: "¿Cuánto es 45 ÷ 9?", respuesta: "5" },
        { pregunta: "¿Cuál es el resultado de 19 + 6?", respuesta: "25" },
        { pregunta: "¿Cuánto es 11 + 8?", respuesta: "19" },
        { pregunta: "¿Cuál es el resultado de 7 x 6?", respuesta: "42" },
        { pregunta: "¿Cuánto es 60 - 35?", respuesta: "25" },
        { pregunta: "¿Qué número es el doble de 15?", respuesta: "30" },
        { pregunta: "¿Cuánto es 21 ÷ 7?", respuesta: "3" },
        { pregunta: "¿Cuál es el resultado de 16 + 14?", respuesta: "30" },
        { pregunta: "¿Qué número es la mitad de 18?", respuesta: "9" },
        { pregunta: "¿Cuánto es 10 x 3?", respuesta: "30" },
        { pregunta: "¿Cuál es el resultado de 28 - 19?", respuesta: "9" },
        { pregunta: "¿Cuánto es 9 + 17?", respuesta: "26" }
    ],
};// Palabras aleatorias para el juego de reacciones

const palabrasAleatorias = [
    "genial", "cool", "bravo", "sí", "nope", "wow", "jaja", "bien", "mal", "top",
    "luz", "estrella", "risa", "fuego", "agua", "nube", "sol", "luna", "cielo", "tierra",
    "rápido", "lento", "fuerte", "débil", "alto", "bajo", "calor", "frío", "dulce", "salado",
    "gato", "perro", "pájaro", "pez", "oso", "tigre", "león", "mono", "elefante", "jirafa",
    "rojo", "azul", "verde", "amarillo", "negro", "blanco", "rosa", "violeta", "naranja", "gris",
    "casa", "árbol", "río", "montaña", "playa", "bosque", "desierto", "ciudad", "pueblo", "camino",
    "feliz", "triste", "enojado", "calmo", "cansado", "vivo", "raro", "simple", "duro", "suave",
    "chévere", "pana", "vaina", "cacha", "webada", "bacán", "tranqui", "locura", "suerte", "fácil",
    "noche", "día", "sombra", "brisa", "lluvia", "nieve", "trueno", "rayo", "mar", "arena",
    "piedra", "roca", "valle", "cerro", "lago", "isla", "puente", "calle", "puerta", "ventana",
    "ratón", "lobo", "zorro", "ciervo", "águila", "búho", "serpiente", "rana", "canguro", "koala",
    "tortuga", "ballena", "delfín", "pulpo", "medusa", "araña", "hormiga", "abejorro", "mariposa", "grillo",
    "celeste", "turquesa", "dorado", "plateado", "marrón", "beige", "lila", "índigo", "coral", "crema",
    "alegría", "miedo", "sorpresa", "duda", "paz", "guerra", "sueño", "despertar", "silencio", "ruido",
    "caliente", "helado", "seco", "húmedo", "claro", "oscuro", "pesado", "ligero", "largo", "corto",
    "zapato", "camisa", "pantalón", "sombrero", "bufanda", "guante", "bolsa", "libro", "lápiz", "papel",
    "mesa", "silla", "cama", "almohada", "espejo", "reloj", "lámpara", "vela", "flor", "fruta",
    "pan", "queso", "carne", "pescado", "arroz", "sopa", "torta", "helado", "jugo", "café",
    "rana", "salto", "brinco", "sal", "azúcar", "pimienta", "limón", "naranja", "manzana", "pera",
    "sol", "luna", "estrella", "nube", "viento", "tormenta", "relámpago", "trueno", "arcoíris", "niebla",
    "montaña", "volcán", "cueva", "selva", "pantano", "prado", "colina", "orilla", "borde", "camino",
    "rápido", "veloz", "prisa", "tarde", "temprano", "ahora", "nunca", "siempre", "ayer", "mañana",
    "roca", "piedra", "arena", "polvo", "barro", "hielo", "cristal", "metal", "madera", "plástico",
    "baila", "canta", "corre", "salta", "nada", "vuela", "grita", "susurra", "ríe", "llora",
    "suerte", "azar", "destino", "casualidad", "milagro", "misterio", "secreto", "adivinanza", "enigma", "truco",
    "fiesta", "juego", "cuento", "canción", "poema", "sueño", "recuerdo", "olvido", "esperanza", "fe",
    "brillo", "chispa", "fuego", "ceniza", "humo", "llama", "calor", "vapor", "frío", "nieve",
    "ola", "corriente", "marea", "espuma", "burbuja", "gota", "río", "lago", "mar", "océano",
    "bosque", "selva", "prado", "desierto", "pantano", "cueva", "montaña", "valle", "colina", "abismo"
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
    "el desierto guarda misterios bajo su arena dorada y caliente",
    "el ceviche fresco en la playa es lo mejor pa’l alma costeña",
    "un mono curioso salta entre las ramas buscando su comida",
    "la brisa del mar acaricia la cara en un día de verano",
    "el gallo canta fuerte pa’ despertar al pueblo entero",
    "una tortuga cruza lento el camino sin mirar pa’ los lados",
    "el sol se esconde tras las montañas pintando el cielo naranja",
    "un perro juega con su pelota en el patio bajo el sol",
    "la selva guarda secretos que solo los valientes descubren",
    "un pescador lanza su red al mar con esperanza en los ojos",
    "el olor a pan recién horneado llena la casa de alegría",
    "una estrella fugaz cruza el cielo y alguien pide un deseo",
    "el mercado bulle con voces y colores en la mañana",
    "un caballo galopa libre por la llanura sin fin",
    "la fogata crepita mientras las historias se cuentan",
    "un delfín salta juguetón entre las olas del océano",
    "el silencio de la noche solo lo rompe el canto del grillo",
    "una flor abre sus pétalos al primer rayo de sol",
    "el tren silba fuerte mientras cruza el puente viejo",
    "un niño pinta su sueño en un papel con crayones",
    "la ciudad brilla con luces al caer la tarde",
    "un águila vuela alto buscando su próxima presa",
    "el aroma del café sube desde la taza en la mesa",
    "una ola gigante rompe contra el malecón con fuerza",
    "el viento mueve las palmeras en un baile tropical",
    "un loro parlanchín repite todo lo que escucha",
    "la luna refleja su luz en el lago como un espejo",
    "un viejo pescador remienda su red bajo el sol",
    "el tambor suena fuerte en la fiesta del pueblo",
    "una mariposa vuela libre entre las flores del campo",
    "el reloj de la iglesia marca el paso del tiempo",
    "un cangrejo corre rápido pa’ esconderse en la arena",
    "la lluvia refresca la tierra seca después de días",
    "un colibrí zumba rápido chupando néctar de una flor",
    "el faro guía a los barcos en la noche oscura",
    "una cometa sube alto con el viento a su favor",
    "el humo sube lento desde la chimenea del rancho",
    "un zorro astuto acecha en el bosque al anochecer",
    "la playa se llena de risas y juegos al mediodía",
    "un búho observa todo desde lo alto de un árbol",
    "el río canta mientras corre entre las piedras lisas",
    "una guitarra suena suave en la noche estrellada",
    "el sol calienta la espalda de los que trabajan la tierra",
    "un niño sopla burbujas que flotan por el aire",
    "la sombra de las nubes corre sobre el valle verde",
    "un pez salta fuera del agua pa’ volver a caer",
    "el mercado huele a frutas frescas y pescado salado",
    "una vaca pasta tranquila en el campo abierto",
    "el relámpago corta el cielo antes del gran trueno",
    "un camión pasa rápido por la carretera polvorienta",
    "la brisa mueve las cortinas de la ventana abierta",
    "un perro ladra fuerte pa’ avisar que alguien llega",
    "el atardecer pinta el mar de rojo y dorado",
    "una hormiga lleva una hoja más grande que ella",
    "el gallo despierta al pueblo con su canto alegre",
    "un barco navega lento por el río al amanecer",
    "la nieve cubre los tejados en un silencio blanco",
    "un gato duerme tranquilo en el tejado caliente",
    "el viento lleva el olor a sal del mar lejano",
    "una rana salta al agua pa’ escapar del peligro",
    "el sol sube lento sobre el horizonte del campo",
    "un niño corre tras una pelota bajo el sol ardiente",
    "la luna brilla fuerte en un cielo sin nubes",
    "un pescador lanza su anzuelo con calma y paciencia",
    "el aroma a mango maduro llena el aire del patio",
    "una paloma vuela libre sobre la plaza del pueblo",
    "el río refleja las estrellas en una noche clara",
    "un caballo relincha mientras corre por el prado",
    "la lluvia moja las hojas que caen del árbol",
    "un pájaro teje su nido con ramitas del bosque",
    "el sol seca la ropa colgada en el tendedero",
    "una ardilla guarda nueces pa’l invierno frío",
    "el mar ruge fuerte en una tormenta salvaje",
    "un niño dibuja el sol con crayones amarillos",
    "la brisa refresca el calor de la tarde pesada",
    "un perro corre feliz tras un palo en la playa",
    "el cielo se llena de colores al caer el sol",
    "una abeja vuela rápido buscando más flores",
    "el tren pasa silbando por el pueblo dormido",
    "un gato cazador acecha bajo la luz de la luna"
];

// Estado
let instanceId = uuidv4();
let activeTrivia = new Map(); // Una trivia por canal
let sentMessages = new Map();
let processedMessages = new Map();
let dataStore = { 
    conversationHistory: {}, 
    triviaRanking: {}, 
    personalPPMRecords: {}, 
    reactionStats: {}, 
    reactionWins: {}, 
    activeSessions: {}, // Claves como trivia_${channel.id}, reaction_${channel.id}
    triviaStats: {},
    musicSessions: {},
    updatesSent: false, // Para controlar actualizaciones
};
let dataStoreModified = false;
let autosaveEnabled = true;
let autosavePausedByMusic = false;

// Utilidades con tono argentino
const createEmbed = (color, title, description, footer = 'Hecho con onda por Oliver IA') => {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description || ' ')
        .setFooter({ text: footer })
        .setTimestamp();
};

const sendError = async (channel, message, suggestion = '¿Probamos de nuevo, loco?', footer = 'Hecho con onda por Oliver IA') => {
    const embed = createEmbed('#FF5555', '¡Uh, qué cagada!', `${message}\n${suggestion}`, footer);
    return await channel.send({ embeds: [embed] });
};

const sendSuccess = async (channel, title, message, footer = 'Hecho con onda por Oliver IA') => {
    const embed = createEmbed('#55FF55', title, message, footer);
    return await channel.send({ embeds: [embed] });
};

function cleanText(text) {
    return text.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/^(el|la|los|las)\s+/i, '');
}

// Función para generar la imagen con Puppeteer
async function generateImage(prompt, style) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            console.log(`Generando imagen para: "${prompt}" en estilo ${style} - Intento ${attempt + 1}`);
            const fullPrompt = `Una imagen copada de ${prompt}, estilo ${style}, con onda argentina, 4k, detalles zarpados`;
            const response = await axios.post(API_URL, {
                inputs: fullPrompt,
                parameters: {
                    negative_prompt: "borroso, feo, baja calidad, distorsionado",
                    num_inference_steps: 50,
                    guidance_scale: 7.5
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            });

            const imageBase64 = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
            return imageBase64;
        } catch (error) {
            attempt++;
            console.error(`Error al generar imagen (intento ${attempt}):`, error.response?.status, error.message);
            if (attempt === maxRetries) {
                throw new Error(`No pude generar la imagen después de ${maxRetries} intentos: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Delay de 2, 4, 6 segundos
        }
    }
}

async function manejarImagen(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const content = message.content.slice(3).trim().toLowerCase();
    const [prompt, style = 'realista'] = content.split(',').map(s => s.trim());

    if (!prompt) {
        return sendError(message.channel, `¡Tirame algo pa’ imaginar, ${userName}! Ej: !im un mate, realista`);
    }

    const waitingEmbed = createEmbed('#55FFFF', `¡Pará un cacho, ${userName}!`, 
        'Estoy generando tu imagen con onda...');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        let fullPrompt = prompt;
        // Hacer el prompt súper específico y claro para todo
        fullPrompt = `una imagen detallada y clara de ${prompt}, estilo ${style}, con resolución 4k, detalles nítidos y realistas, iluminación natural suave, sin marcas de agua, sin elementos distractivos o confusos, fondo limpio y minimalista que resalte el sujeto principal, con texturas bien definidas y colores vibrantes`;

        const imageBase64 = await generateImage(fullPrompt, style);
        const imageId = crypto.randomUUID();
        const embed = createEmbed('#55FF55', `¡Acá tenés, ${userName}!`, 
            `Tu imagen de "${prompt}" en estilo ${style} quedó zarpada. ID: ${imageId}. ¿Te copa?`, 
            `Hecho con onda por Oliver IA • ${new Date().toLocaleString()}`);
        await waitingMessage.edit({ embeds: [embed], files: [{ attachment: Buffer.from(imageBase64, 'base64'), name: `${imageId}.png` }] });
        generatedImages.set(imageId, { base64: imageBase64, prompt: fullPrompt, style });
    } catch (error) {
        console.error('Error generando imagen:', error.message);
        const errorEmbed = createEmbed('#FF5555', '¡Qué cagada!', 
            `No pude generar la imagen de "${prompt}", ${userName}. Error: ${error.message}. ¿Probamos más tarde o con otra cosa, loco?`, 
            `Hecho con onda por Oliver IA • ${new Date().toLocaleString()}`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

module.exports = { manejarImagen };

// Comando !misimagenes para ver el historial
async function manejarMisImagenes(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (!dataStore.imageHistory || !dataStore.imageHistory[userName] || dataStore.imageHistory[userName].length === 0) {
        return sendError(message.channel, `¡No tenés imágenes guardadas, ${userName}!`, 
            'Generá una con !imagen primero, loco.', 'Hecho con onda por Oliver IA');
    }

    const images = dataStore.imageHistory[userName];
    const imageList = images.slice(-5).map(img => 
        `ID: **${img.id}** - "${img.prompt}" (estilo ${img.style}) - ${new Date(img.timestamp).toLocaleString('es-AR')}`
    ).join('\n');

    const embed = createEmbed('#FFD700', `📸 Tus imágenes, ${userName}!`, 
        `Acá tenés tus últimas imágenes (máximo 5):\n\n${imageList}\n\nUsá !editarimagen [ID] [cambio] para modificar una, loco.`, 
        'Hecho con onda por Oliver IA');
    await message.channel.send({ embeds: [embed] });
}

// Comando !editarimagen para editar imágenes previas
async function manejarEditarImagen(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.startsWith('!editarimagen') ? message.content.slice(13).trim().split(' ') : message.content.slice(3).trim().split(' ');
    
    if (args.length < 2) {
        return sendError(message.channel, `¡Usá "!editarimagen [ID] [cambio]", ${userName}!`, 
            'Ejemplo: !editarimagen 1234 agregar un perro', 'Hecho con onda por Oliver IA');
    }

    const imageId = args[0];
    const change = args.slice(1).join(' ').trim();

    if (!dataStore.imageHistory || !dataStore.imageHistory[userName]) {
        return sendError(message.channel, `¡No tenés imágenes para editar, ${userName}!`, 
            'Generá una con !imagen primero, loco.', 'Hecho con onda por Oliver IA');
    }

    const image = dataStore.imageHistory[userName].find(img => img.id === imageId);
    if (!image) {
        return sendError(message.channel, `No encontré la imagen con ID ${imageId}, ${userName}.`, 
            'Fijate tus IDs con !misimagenes, loco.', 'Hecho con onda por Oliver IA');
    }

    // Confirmación antes de editar
    const confirmEmbed = createEmbed('#FFAA00', `¡Pará un cacho, ${userName}!`, 
        `¿Querés editar la imagen "${image.prompt}" (ID: ${imageId}) para "${change}"? Reaccioná con ✅ o ❌, loco.`, 
        'Hecho con onda por Oliver IA');
    const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });
    await confirmMessage.react('✅');
    await confirmMessage.react('❌');

    const reactionFilter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
    let reactions;
    try {
        reactions = await confirmMessage.awaitReactions({ filter: reactionFilter, max: 1, time: 30000, errors: ['time'] });
    } catch {
        await sendError(message.channel, `⏳ ¡Te dormiste, ${userName}!`, 
            'No reaccionaste a tiempo, loco. ¿Probamos de nuevo?', 'Hecho con onda por Oliver IA');
        return;
    }

    if (!reactions.size || reactions.first().emoji.name === '❌') {
        await sendSuccess(message.channel, '🛑 ¡Sin cambios!', `Tranqui, ${userName}, la imagen queda como está.`);
        return;
    }

    // Editar la imagen
    const waitingEmbed = createEmbed('#55FFFF', `⌛ Editando, ${userName}...`, 
        `Aguantá que modifico "${image.prompt}" con "${change}"...`, 'Hecho con onda por Oliver IA');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const newPrompt = `Una imagen copada de ${image.prompt}, modificada para ${change}, estilo ${image.style}, con onda argentina`;
        const newImageBase64 = await generateImage(newPrompt);
        const newImageAttachment = { attachment: Buffer.from(newImageBase64.split(',')[1], 'base64'), name: `imagen_editada_${userName}_${Date.now()}.png` };

        // Guardar la nueva versión
        const newImageId = uuidv4();
        dataStore.imageHistory[userName].push({
            id: newImageId,
            prompt: `${image.prompt}, modificada para ${change}`,
            style: image.style,
            base64: newImageBase64,
            timestamp: new Date().toISOString()
        });
        dataStoreModified = true;

        const embed = createEmbed('#FFD700', `¡Listo, ${userName}!`, 
            `Tu imagen editada: "${image.prompt}, ${change}" en estilo ${image.style}. Nuevo ID: ${newImageId}. ¿Te copa, loco?`, 
            'Hecho con onda por Oliver IA');
        await waitingMessage.edit({ embeds: [embed], files: [newImageAttachment] });
    } catch (error) {
        console.error('Error editando imagen:', error.message);
        const errorEmbed = createEmbed('#FF5555', '¡Qué cagada!', 
            `No pude editar la imagen, ${userName}. Error: ${error.message}. ¿Probamos otra vez, loco?`, 
            'Hecho con onda por Oliver IA');
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Función para manejar el comando !ansiedad
async function manejarAnsiedad(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
const tips = [
    "Tomá aire profundo, loco: inhalá contando 4, aguantá 4, soltá en 4. Repetilo tres veces y vas a ver cómo afloja.",
    "Movete un toque, genia: caminá, estirá las patas o bailá algo rápido. ¡Saca esa energía loca!",
    "Tirate a escuchar un tema que te vuele la cabeza, grosa. Música pa’ desconectar.",
    "Pensá en algo copado que hiciste esta semana, che. ¡Vos podés con todo!",
    "Tomate un mate tranqui, genia, y dejá que el calor te relaje el alma, ¡posta!",
    "Escribí todo lo que te preocupa en un papel y después rompelo, loco. ¡Sacate ese peso de encima!",
    "Hacé una lista corta de 3 cosas que te hagan sonreír, grosa. ¡Eso te sube el ánimo al toque!",
    "Mirá un video de gatitos o perritos, che. Esos bichos siempre te sacan una sonrisa, ¡seguro!",
    "Cerrá los ojos y visualizá un lugar re tranqui, como una playa o el campo, genia. ¡Mentalmente viajá ahí un rato!",
    "Estirá el cuerpo como si fueras un gato: brazos pa’ arriba, espalda arqueada. ¡Soltá toda la tensión, loco!",
    "Tomá un vaso de agua fresca bien despacito, grosa. Sentí cómo te refresca y te calma.",
    "Contá al revés desde 10, bien tranqui, che. Eso te ayuda a bajar un cambio, ¡posta!",
    "Ponete a ordenar algo chiquito, como tu escritorio, genia. ¡Eso te da sensación de control y calma!",
    "Mandale un mensaje a alguien que te banque siempre, loco. Charlar un toque te va a hacer bien.",
    "Hacé un mini baile de 30 segundos con tu tema favorito, grosa. ¡A mover el esqueleto y sacar la ansiedad!",
    "Buscá un chiste rápido en el celu y reíte un rato, che. La risa es lo mejor pa’ cortar el estrés.",
    "Acariciá algo suave, como una manta o una remera vieja, genia. ¡Eso te da una calma zarpada!",
    "Imaginá que estás soplando una burbuja gigante y bien lenta, loco. Eso te ayuda a respirar mejor.",
    "Hacete un té o una infusión calentita y tomate un break, grosa. ¡Es como un abrazo en taza!",
    "Salí un toque al balcón o al patio y mirá el cielo, che. El aire fresco te renueva las pilas.",
    "Ponete a dibujar garabatos en una hoja, genia. No hace falta que sea arte, solo dejá que fluya.",
    "Hacé una mini meditación: cerrá los ojos, poné una mano en la panza y respirá hondo 5 veces, loco.",
    "Buscá un meme que te saque una carcajada, grosa. ¡La risa es la mejor medicina, posta!",
    "Contá 5 cosas que ves, 4 que podés tocar, 3 que escuchás, 2 que olés y 1 que saboreás, che. ¡Eso te trae al presente!",
    "Hacé una pausa y mirá por la ventana un rato, genia. Dejá que la mente se despeje sola.",
    "Cantá una canción que te sepas de memoria bien fuerte, loco. ¡A sacar todo lo que tenés adentro!",
    "Tomá un caramelo o un chicle y concentrate en el sabor, grosa. Eso te distrae un toque.",
    "Hacete una lista mental de 3 cosas por las que estás agradecida hoy, che. ¡Eso te sube el ánimo al toque!",
    "Jugá un rato con algo chiquito, como apretar una pelotita antiestrés, genia. ¡Eso te relaja las manos y la cabeza!",
    "Escribí 3 cosas que te salieron bien en el día, loco. ¡Recordá que sos una grosa, siempre!",
    "Mirá una foto de un momento feliz y recordá cómo te sentiste, grosa. ¡Eso te da pilas pa’ seguir!",
    "Hacé un estiramiento de cuello: girá la cabeza despacito pa’ los dos lados, che. ¡Soltá esa tensión acumulada!"
];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    const mensajeMiguel = "¡Ojo al dato, Belén! Miguel te manda un abrazo zarpado y te desea toda la suerte del mundo pa’ ese examen. Confiá en vos, genia, que sos una grosa y la vas a romper, ¡posta!";

    const embed = createEmbed('#55FFFF', `¡Tranqui, ${userName}!`, 
        `${tip}\n\n${mensajeMiguel}\n\n¿Querés charlar más o te tiro otro tip al toque?`, 
        'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
    const sentMessage = await message.channel.send({ embeds: [embed] });
    await sentMessage.react('✅');
    await sentMessage.react('❌');
    sentMessages.set(sentMessage.id, { content: `${tip} ${mensajeMiguel}`, message: sentMessage });
}

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
            triviaStats: {},
            musicSessions: {}, // Asegurado en caso de JSON vacío
            updatesSent: false
        };
        // Asegurar que musicSessions esté presente incluso si no está en el JSON cargado
        if (!loadedData.musicSessions) {
            loadedData.musicSessions = {};
        }
        console.log('Datos cargados desde GitHub con musicSessions asegurado');
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
            triviaStats: {},
            musicSessions: {}, // Asegurado en caso de error
            updatesSent: false
        };
    }
}

async function saveDataStore() {
    if (!dataStoreModified) return false;
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
        console.log('Datos guardados en GitHub');
        return true;
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
        throw error;
    }
}

// Guardado automático (sin cambios, incluido para contexto)
const SAVE_INTERVAL = 1800000;
const WARNING_TIME = 300000;

setInterval(async () => {
    // Verificar si hay música activa en algún servidor
    const musicActive = manager.players.size > 0;
    
    if (musicActive && !autosavePausedByMusic) {
        autosavePausedByMusic = true;
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            await channel.send({ embeds: [createEmbed('#FFAA00', '🎵 Autosave en pausa', 
                '¡Pará un cacho! El guardado automático se frenó porque estás con la música a full.')] });
        }
        return;
    }

    if (!musicActive && autosavePausedByMusic) {
        autosavePausedByMusic = false;
        autosaveEnabled = true; // Reanudar autosave si estaba pausado solo por música
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            await channel.send({ embeds: [createEmbed('#55FF55', '💾 Autosave de vuelta', 
                'La música paró, así que el guardado automático arrancó de nuevo, ¡dale!')] });
        }
    }

    if (!dataStoreModified || !autosaveEnabled || autosavePausedByMusic) return;

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
        await channel.send({ embeds: [createEmbed('#FFAA00', '⏰ Ojo al dato', 
            '¡Atenti, che! En 5 minutos guardo todo automáticamente.')] });
    }
    setTimeout(async () => {
        if (!autosaveEnabled || autosavePausedByMusic) return; // No guardar si está pausado
        await saveDataStore();
        if (channel) {
            await channel.send({ embeds: [createEmbed('#55FF55', '💾 ¡Listo el pollo!', 
                'Datos guardados al toque, ¡tranqui!')] });
        }
        dataStoreModified = false;
    }, WARNING_TIME);
}, SAVE_INTERVAL);



// Normalización de texto para manejar tildes
function normalizeText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Obtener una pregunta de trivia (sin cambios, pero añadido log para depuración)
function obtenerPreguntaTriviaSinOpciones(usedQuestions, categoria) {
    console.log("Obteniendo pregunta para categoría:", categoria, "Preguntas usadas:", usedQuestions.length);
    const preguntasCategoria = preguntasTriviaSinOpciones[categoria] || [];
    const available = preguntasCategoria.filter(q => !usedQuestions.includes(q.pregunta));
    console.log("Preguntas disponibles:", available.length);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

// Función principal de trivia corregida
async function manejarTrivia(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

    const args = normalizeText(message.content).split(' ').slice(1);
    const categoria = args[0] in preguntasTriviaSinOpciones ? args[0] : 'capitales';
    const numQuestions = Math.max(parseInt(args[1]) || 20, 20);

    const triviaKey = `trivia_${message.channel.id}`;
    if (dataStore.activeSessions[triviaKey]) {
        await sendError(message.channel, `Ya hay una trivia activa en este canal, ${userName}.`, 'Cancelala con !tc primero.');
        return;
    }

    let session = {
        type: 'trivia',
        currentQuestion: 0,
        score: 0,
        totalQuestions: numQuestions,
        usedQuestions: [],
        categoria,
        active: true,
    };
    dataStore.activeSessions[triviaKey] = session;
    dataStoreModified = true;

    while (session.currentQuestion < session.totalQuestions && session.active) {
        if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break;

        const available = preguntasTriviaSinOpciones[categoria].filter(q => !session.usedQuestions.includes(q.pregunta));
        if (!available.length) {
            await sendSuccess(message.channel, '🏁 ¡Se acabaron las preguntas!', `No hay más en ${categoria}, ${userName}.`);
            break;
        }

        const trivia = available[Math.floor(Math.random() * available.length)];
        session.usedQuestions.push(trivia.pregunta);
        const embed = createEmbed('#55FFFF', `🎲 Pregunta ${session.currentQuestion + 1}/${numQuestions} (${categoria})`,
            `${trivia.pregunta}\n\n¡Responde en 60 segundos, ${userName}! O cancelá con !tc.`);
        const sent = await message.channel.send({ embeds: [embed] });

        activeTrivia.set(message.channel.id, { id: sent.id, correcta: trivia.respuesta, userId: message.author.id });
        dataStoreModified = true;

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!tc', '!trivia cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 60000,
                errors: ['time'],
            });
            const respuesta = cleanText(respuestas.first().content);
            activeTrivia.delete(message.channel.id);

            if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break;

            if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
            if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
            dataStore.triviaStats[message.author.id][categoria].total += 1;

            if (respuesta === cleanText(trivia.respuesta)) {
                session.score += 1;
                dataStore.triviaStats[message.author.id][categoria].correct += 1;
                await sendSuccess(message.channel, '🎉 ¡Acierto!', `¡Grande, ${userName}! Era **${trivia.respuesta}**. Vas ${session.score}.`);
            } else {
                await sendError(message.channel, '❌ ¡Fallaste!', `La posta era **${trivia.respuesta}**, ${userName}. Dijiste "${respuesta}".`);
            }
            session.currentQuestion += 1;
            dataStore.activeSessions[triviaKey] = session;
            dataStoreModified = true;
        } catch {
            activeTrivia.delete(message.channel.id);
            if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break;
            await sendError(message.channel, '⏳ ¡Tiempo!', `Se acabó, ${userName}. Era **${trivia.respuesta}**.`);
            session.currentQuestion += 1;
            dataStore.activeSessions[triviaKey] = session;
            dataStoreModified = true;
        }
    }

    // Este bloque ya está bien puesto acá dentro
    if (session.currentQuestion >= session.totalQuestions && dataStore.activeSessions[triviaKey]) {
        await sendSuccess(message.channel, '🏁 ¡Trivia terminada!', `Puntuación: ${session.score}/${numQuestions}, ${userName}.`);
        if (!dataStore.triviaRanking[message.author.id]) dataStore.triviaRanking[message.author.id] = {};
        dataStore.triviaRanking[message.author.id][categoria] = dataStore.triviaStats[message.author.id][categoria].correct;
        delete dataStore.activeSessions[triviaKey];
        activeTrivia.delete(message.channel.id);
        dataStoreModified = true;
    }
}

async function manejarAutosave(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (autosavePausedByMusic && autosaveEnabled) {
        return sendError(message.channel, `El autosave está en pausa por la música, ${userName}.`, 
            'Esperá a que termine el tema o usá !st para cortarla.');
    }

    autosaveEnabled = !autosaveEnabled;
    
    if (autosaveEnabled) {
        await sendSuccess(message.channel, '💾 ¡Autosave prendido!', 
            `El guardado automático arrancó de nuevo, ${userName}. Se guarda cada 30 minutos, ¡tranqui!`);
    } else {
        await sendSuccess(message.channel, '⏸️ ¡Autosave en pausa!', 
            `Paré el guardado automático, ${userName}. Usá !as para volver a prenderlo o !save para guardar ya.`);
    }
}

// PPM
function obtenerFrasePPM() {
    return frasesPPM[Math.floor(Math.random() * frasesPPM.length)];
}

async function manejarPPM(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

    const ppmKey = `ppm_${message.author.id}`;
    let session = dataStore.activeSessions[ppmKey];

    if (session && !session.completed) {
        await sendError(message.channel, `Ya tenés un PPM activo, ${userName}.`, 'Termina el actual o cancelalo con !pc.');
        return;
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

    let intentoCorrecto = false;
    session = { type: 'ppm', frase: null, startTime: null, completed: false, active: true };
    dataStore.activeSessions[ppmKey] = session;
    dataStoreModified = true;

    while (!intentoCorrecto && session.active) {
        if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;

        const frase = obtenerFrasePPM();
        const startTime = Date.now();
        const embed = createEmbed('#55FFFF', '📝 Prueba de Mecanografía',
            `Escribí esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTenés 15 segundos, ${userName}. (!pc para cancelar)`);
        await message.channel.send({ embeds: [embed] });

        session.frase = frase;
        session.startTime = startTime;
        dataStore.activeSessions[ppmKey] = session;
        dataStoreModified = true;

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!pc', '!ppm cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 15000,
                errors: ['time'],
            });
            const respuestaUsuario = cleanText(respuestas.first().content);
            const endTime = Date.now();

            if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;

            session.completed = true;
            delete dataStore.activeSessions[ppmKey];
            dataStoreModified = true;

            const tiempoSegundos = (endTime - startTime) / 1000;
            const palabras = frase.split(' ').length;
            const ppm = Math.round((palabras / tiempoSegundos) * 60);

            if (respuestaUsuario === cleanText(frase)) {
                intentoCorrecto = true;
                if (!dataStore.personalPPMRecords[message.author.id]) {
                    dataStore.personalPPMRecords[message.author.id] = { best: { ppm: 0, timestamp: null }, attempts: [] };
                }

                dataStore.personalPPMRecords[message.author.id].attempts.push({ ppm, timestamp: new Date().toISOString() });
                dataStoreModified = true;

                const currentBest = dataStore.personalPPMRecords[message.author.id].best.ppm || 0;
                if (ppm > currentBest) {
                    dataStore.personalPPMRecords[message.author.id].best = { ppm, timestamp: new Date().toISOString() };
                    dataStoreModified = true;
                    await sendSuccess(message.channel, '🎉 ¡Récord nuevo, crack!',
                        `¡Sos un animal, ${userName}! Tipeaste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu nuevo récord: **${ppm} PPM**. Mirá tus intentos con !rppm.`);
                } else {
                    await sendSuccess(message.channel, '🎉 ¡Copado, che!',
                        `¡Bien ahí, ${userName}! La frase te salió en ${tiempoSegundos.toFixed(2)} segundos.\nTu PPM: **${ppm}**. Tu récord sigue en **${currentBest} PPM**. Fijate todo con !rppm.`);
                }
            } else {
                await sendError(message.channel, '❌ ¡Casi la pegás!',
                    `¡Uy, ${userName}, te mandaste una cagada! Tu respuesta fue "${respuestaUsuario}". La posta era **${frase}**. ¡Probá de nuevo, dale!`);
            }
        } catch {
            if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;
            await sendError(message.channel, '⏳ ¡Te dormiste, boludo!',
                `Se te fue el tiempo, ${userName}. La frase era: **${frase}**. ¡Otra chance ahora!`);
        }
    }
}

// Reacciones
function obtenerPalabraAleatoria() {
    return palabrasAleatorias[Math.floor(Math.random() * palabrasAleatorias.length)];
}

async function manejarReacciones(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

    const reactionKey = `reaction_${message.channel.id}`;
    let session = dataStore.activeSessions[reactionKey];

    // Si ya hay una sesión activa y no está completada, la cancelamos
    if (session && !session.completed) {
        session.completed = true;
        delete dataStore.activeSessions[reactionKey];
        dataStoreModified = true;
        await sendSuccess(message.channel, '🛑 ¡Reacciones paradas!', `Puntuación: ${session.score}, ${userName}.`);
        return;
    }

    // Nueva sesión
    session = { type: 'reaction', score: 0, currentRound: 0, completed: false, active: true };
    dataStore.activeSessions[reactionKey] = session;
    dataStoreModified = true;

    while (!session.completed && session.active) {
        // Verificamos si la sesión sigue activa antes de cada ronda
        if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

        const palabra = obtenerPalabraAleatoria();
        const embed = createEmbed('#FFD700', `🏁 Ronda ${session.currentRound + 1}`, 
            `Escribí: **${palabra}** en 30 segundos, ${userName}! (!rc para parar)`);
        await message.channel.send({ embeds: [embed] });

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!rc', '!reacciones cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 30000,
                errors: ['time'],
            });

            // Verificamos de nuevo después de esperar la respuesta
            if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

            const respuesta = respuestas.first().content.toLowerCase();
            if (respuesta === palabra) {
                session.score += 1;
                await sendSuccess(message.channel, '🎉 ¡Bien!', `La pegaste, ${userName}. Vas ${session.score}.`);
            } else {
                session.completed = true;
                await sendError(message.channel, '❌ ¡Error!', `Fallaste, ${userName}. Era **${palabra}**.`);
            }
            session.currentRound += 1;
            dataStore.activeSessions[reactionKey] = session;
            dataStoreModified = true;
        } catch {
            // Si se acaba el tiempo, verificamos si se canceló
            if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

            session.completed = true;
            await sendError(message.channel, '⏳ ¡Tiempo!', `Se acabó, ${userName}. Puntuación: ${session.score}.`);
            delete dataStore.activeSessions[reactionKey];
            dataStoreModified = true;
        }
    }

    // Limpieza final si se termina normalmente
    if (dataStore.activeSessions[reactionKey] && session.completed) {
        delete dataStore.activeSessions[reactionKey];
        dataStoreModified = true;
    }
}

async function manejarLyrics(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);

    const args = message.content.toLowerCase().split(' ').slice(1).join(' ').trim();
    const player = manager.players.get(message.guild.id);
    let songTitle;

    if (!args) {
        if (!player || !player.queue.current) {
            return sendError(message.channel, `No hay ninguna canción sonando ahora, ${userName}. Usa !lyrics [nombre de la canción] para buscar una específica.`);
        }
        songTitle = player.queue.current.title;
    } else {
        songTitle = args.replace(/\s*\(videoclip oficial\)/i, '').trim(); // Limpia el título
    }

    const waitingEmbed = createEmbed('#55FFFF', `⌛ Buscando letras, ${userName}...`, `Espera un momento mientras busco las letras de "${songTitle}".`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        // Buscar la canción en Genius
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(songTitle)}`;
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` }
        });

        const hits = searchResponse.data.response.hits;
        if (!hits || hits.length === 0) {
            throw new Error('No se encontraron resultados en Genius.');
        }

        // Tomar el primer resultado (el más relevante)
        const songId = hits[0].result.id;

        // Obtener detalles de la canción (necesitamos la URL para scrapear las letras)
        const songUrl = `https://api.genius.com/songs/${songId}`;
        const songResponse = await axios.get(songUrl, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` }
        });

        const lyricsPath = songResponse.data.response.song.path;

        // Scrapear las letras desde la página pública de Genius
        const lyricsPageUrl = `https://genius.com${lyricsPath}`;
        const lyricsPage = await axios.get(lyricsPageUrl);
        const lyricsHtml = lyricsPage.data;
        const lyricsMatch = lyricsHtml.match(/<div[^>]*class="Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        let lyrics = lyricsMatch ? lyricsHtml.match(/<div[^>]*class="Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/i)[1] : 'No se pudieron extraer las letras.';
        
        // Limpiar etiquetas HTML
        lyrics = lyrics.replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();

        if (!lyrics || lyrics === '') {
            throw new Error('No se encontraron letras para esta canción.');
        }

        // Manejar el límite de 2000 caracteres
        const maxLength = 2000;
        if (lyrics.length <= maxLength) {
            const embed = createEmbed('#FFD700', `🎵 Letras de "${songTitle}"`, lyrics);
            await waitingMessage.edit({ embeds: [embed] });
        } else {
            const chunks = [];
            for (let i = 0; i < lyrics.length; i += maxLength) {
                chunks.push(lyrics.substring(i, i + maxLength));
            }
            const firstEmbed = createEmbed('#FFD700', `🎵 Letras de "${songTitle}" (Parte 1/${chunks.length})`, chunks[0]);
            await waitingMessage.edit({ embeds: [firstEmbed] });
            for (let i = 1; i < chunks.length; i++) {
                const embed = createEmbed('#FFD700', `🎵 Letras de "${songTitle}" (Parte ${i + 1}/${chunks.length})`, chunks[i]);
                await message.channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(`Error al buscar letras para "${songTitle}": ${error.message}`);
        await waitingMessage.edit({ embeds: [createEmbed('#FF5555', '¡Ups!', `No pude encontrar las letras de "${songTitle}", ${userName}. Puede ser que no esté en Genius o hubo un error: ${error.message}`)] });
    }
}

// Chat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Usamos Flash por velocidad

async function manejarChat(message) {
    const userId = message.author.id;
    const userName = userId === OWNER_ID ? 'Miguel' : 'Belén';
    const chatMessage = message.content.startsWith('!chat') ? message.content.slice(5).trim() : message.content.slice(3).trim();

    if (!chatMessage) {
        return sendError(message.channel, `¡Escribí algo después de "!ch", ${userName}! No me dejes colgado, che.`, undefined, 'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
    }

    // Inicializar historial si no existe
    if (!dataStore.conversationHistory) dataStore.conversationHistory = {};
    if (!dataStore.conversationHistory[userId]) dataStore.conversationHistory[userId] = [];

    // Agregar el mensaje del usuario al historial
    dataStore.conversationHistory[userId].push({ role: 'user', content: chatMessage, timestamp: Date.now() });
    // Limitar a 20 interacciones
    if (dataStore.conversationHistory[userId].length > 20) {
        dataStore.conversationHistory[userId] = dataStore.conversationHistory[userId].slice(-20);
    }
    dataStoreModified = true;

    // Armar el contexto con las últimas 20
    const history = dataStore.conversationHistory[userId].slice(-20);
    const context = history.map(h => `${h.role === 'user' ? userName : 'Oliver'}: ${h.content}`).join('\n');
    
    const waitingEmbed = createEmbed('#55FFFF', `¡Aguantá un toque, ${userName}!`, 'Estoy pensando una respuesta re copada...', 'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const prompt = `Sos Oliver IA, un bot re piola creado por Miguel. Hablá con onda argentina, usá "loco", "che", "posta". Esto es lo que charlamos antes:\n${context}\nRespondé a: "${chatMessage}" como amigo zarpado, con cariño si es para Belén, tipo "grosa" o "genia".`;
        
        const result = await model.generateContent(prompt);
        let aiReply = result.response.text().trim();

        // Agregar la respuesta al historial
        dataStore.conversationHistory[userId].push({ role: 'assistant', content: aiReply, timestamp: Date.now() });
        if (dataStore.conversationHistory[userId].length > 20) {
            dataStore.conversationHistory[userId] = dataStore.conversationHistory[userId].slice(-20);
        }
        dataStoreModified = true;

        if (aiReply.length > 2000) aiReply = aiReply.slice(0, 1990) + '... (seguí charlando pa’ más, loco)';
        
        const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, `${aiReply}\n\n¿Te cerró, ${userName}? ¡Seguimos charlando, che!`, 'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
        const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
        await updatedMessage.react('✅');
        await updatedMessage.react('❌');
        sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });
    } catch (error) {
        console.error('Error con Gemini:', error.message);
        const fallbackReply = `¡Uy, ${userName}, qué cagada! Me mandé un moco, loco. ¿Me tirás otra vez el mensaje o seguimos con otra cosa?\n\n¿Te cerró, ${userName}? ¡Seguimos charlando, che!]`;
        const errorEmbed = createEmbed('#FF5555', `¡Qué cagada, ${userName}!`, fallbackReply, 'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
        const errorMessageSent = await waitingMessage.edit({ embeds: [errorEmbed] });
        await errorMessageSent.react('✅');
        await errorMessageSent.react('❌');
    }
}

// Nuevos comandos: !sugerencias y !ayuda
async function manejarSugerencias(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const suggestion = message.content.startsWith('!sugerencias') ? message.content.slice(12).trim() : message.content.slice(4).trim();
    if (!suggestion) {
        return sendError(message.channel, `Escribe tu sugerencia después de "!su", ${userName}. ¡Quiero escuchar tus ideas!`);
    }

    const owner = await client.users.fetch(OWNER_ID);
    const ownerEmbed = createEmbed('#FFD700', '💡 Nueva sugerencia de Belén',
        `${userName} propone: "${suggestion}"\nReacciona con ✅ para dar visto, loco.\nUsá !responder en cualquier canal para contestarle por MD.`);

    try {
        const sentToOwner = await owner.send({ embeds: [ownerEmbed] });
        await sentToOwner.react('✅');
        sentMessages.set(sentToOwner.id, { 
            type: 'suggestion', 
            suggestion, 
            channelId: message.channel.id, 
            userId: message.author.id, 
            timestamp: Date.now() // Agregamos timestamp
        });

        await sendSuccess(message.channel, '¡Sugerencia enviada!',
            `Tu idea ya está con Miguel, ${userName}. ¡Si le da el visto o te responde con !responder, te llega por MD, genia!`);
    } catch (error) {
        console.error('Error al enviar sugerencia:', error);
        await sendError(message.channel, 'No pude enviar tu sugerencia', `Ocurrió un error, ${userName}. ¿Intentamos de nuevo?`);
    }
}

async function manejarAyuda(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const issue = message.content.startsWith('!ayuda') ? message.content.slice(6).trim() : message.content.slice(3).trim();
    if (!issue) {
        return sendError(message.channel, `Dime qué necesitas después de "!ay", ${userName}.`);
    }

    const owner = await client.users.fetch(OWNER_ID);
    const attachments = message.attachments.size > 0 ? message.attachments.map(att => att.url) : [];
    const ownerEmbed = createEmbed('#FFD700', '¡Solicitud de ayuda!',
        `${userName} necesita ayuda con: "${issue}"\n` +
        (attachments.length > 0 ? `Imágenes adjuntas:\n${attachments.join('\n')}` : 'Sin imágenes adjuntas.') +
        `\nUsá !responder en cualquier canal para contestarle por MD, loco.`);

    try {
        const sentToOwner = await owner.send({ embeds: [ownerEmbed] });
        sentMessages.set(sentToOwner.id, { 
            type: 'help', 
            issue, 
            channelId: message.channel.id, 
            userId: message.author.id, 
            attachments, 
            timestamp: Date.now() // Agregamos timestamp
        });

        await sendSuccess(message.channel, '¡Ayuda en camino!',
            `Ya le avisé a Miguel, ${userName}. ¡Si te responde con !responder, lo vas a ver por MD, grosa!`);
    } catch (error) {
        console.error('Error al enviar ayuda:', error);
        await sendError(message.channel, 'No pude avisar a Miguel', `Ocurrió un error, ${userName}. ¿Intentamos de nuevo?`);
    }
}

async function manejarResponder(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (message.author.id !== OWNER_ID) return;

    console.log(`[${instanceId}] Ejecutando !responder por ${userName} con contenido: "${message.content}"`);

    const args = message.content.slice(10).trim();
    if (!args) {
        console.log(`[${instanceId}] Error: No hay argumentos en !responder`);
        return sendError(message.channel, `Escribí algo después de "!responder", ${userName}. ¿Qué le querés decir a Belén por MD?`);
    }

    console.log(`[${instanceId}] Argumentos extraídos: "${args}"`);

    let belen;
    try {
        belen = await client.users.fetch(ALLOWED_USER_ID);
        console.log(`[${instanceId}] Usuario Belén (${ALLOWED_USER_ID}) obtenido con éxito`);
    } catch (error) {
        console.error(`[${instanceId}] Error al obtener usuario Belén: ${error.message}`);
        return sendError(message.channel, '❌ ¡No pude encontrar a Belén!', `Error: ${error.message}, ${userName}.`);
    }

    const attachments = message.attachments.size > 0 ? message.attachments.map(att => ({ attachment: att.url })) : [];
    console.log(`[${instanceId}] Preparando envío a Belén (${ALLOWED_USER_ID}), adjuntos: ${attachments.length}`);

    try {
        const responseEmbed = createEmbed('#FFD700', '📬 Mensaje de Miguel',
            `Miguel dice: "${args || 'Sin texto, pero mirá las imágenes si hay.'}"`);
        
        console.log(`[${instanceId}] Enviando mensaje a Belén...`);
        await belen.send({ embeds: [responseEmbed], files: attachments });
        console.log(`[${instanceId}] Mensaje enviado exitosamente a Belén`);

        await sendSuccess(message.channel, '✅ ¡Respuesta enviada!',
            `Le mandé tu mensaje a Belén por MD, ${userName}. ¡Ya lo va a ver, loco!`);
    } catch (error) {
        console.error(`[${instanceId}] Error al enviar mensaje por MD: ${error.message}`);
        await sendError(message.channel, '❌ ¡No pude mandarle el MD a Belén!',
            `Algo falló, ${userName}. Error: ${error.message}. ¿Belén tiene los MD abiertos para el bot?`);
    }
}

async function manejarActualizaciones(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (message.author.id !== ALLOWED_USER_ID) return; // Solo Belén puede usarlo

    const argentinaTime = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    const updatesText = BOT_UPDATES.length > 0 
        ? BOT_UPDATES.map((update, index) => `${index + 1}. ${update}`).join('\n')
        : 'No hay actualizaciones nuevas por ahora, ¡pero seguí atenta, genia!';

    const embed = createEmbed('#FFD700', '📢 Últimas Actualizaciones de Oliver IA',
        `¡Mirá lo nuevo que traigo, ${userName}!\n\n${updatesText}\n\n**Hora local (Argentina):** ${argentinaTime}`,
        'Hecho con onda por Miguel IA');
    
    await message.channel.send({ embeds: [embed] });
}

// Funciones de música
async function manejarPlay(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().split(' ').slice(1).join(' ').trim();
    
    console.log(`Iniciando manejarPlay para ${userName} con args: "${args}"`);
    if (!args) return sendError(message.channel, `Dime qué reproducir después de "!pl", ${userName}.`);
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    if (!message.member || !message.member.voice.channel) return sendError(message.channel, `Debes estar en un canal de voz, ${userName}.`);

    const player = manager.create({
        guild: message.guild.id,
        voiceChannel: message.member.voice.channel.id,
        textChannel: message.channel.id,
        selfDeafen: true,
    });

    if (player.state !== 'CONNECTED') {
        console.log('Conectando player...');
        player.connect();
    }

    let res;
    try {
        console.log(`Buscando "${args}"...`);
        const isUrl = args.startsWith('http://') || args.startsWith('https://');
        res = await manager.search(args, message.author);

        console.log(`Resultado de búsqueda: ${res.loadType}`);
        if (res.loadType === 'NO_MATCHES') {
            return sendError(message.channel, `No encontré resultados para "${args}", ${userName}.`);
        }
        if (res.loadType === 'LOAD_FAILED') {
            throw new Error(`No se pudo cargar: ${res.exception?.message || 'Error desconocido'}`);
        }

        if (res.loadType === 'PLAYLIST_LOADED') {
            res.tracks.forEach(track => player.queue.add(track));
            const embed = createEmbed('#55FFFF', '🎶 ¡Playlist añadida!',
                `**${res.playlist.name}** (${res.tracks.length} canciones) ha sido añadida a la cola.\nSolicitada por: ${userName}`)
                .setThumbnail(res.tracks[0].thumbnail || null);
            await message.channel.send({ embeds: [embed] });
        } else {
            const track = res.tracks[0];
            player.queue.add(track);
            const embed = createEmbed('#55FFFF', '🎶 ¡Música añadida!',
                `**${track.title}** ha sido añadida a la cola.\nDuración: ${Math.floor(track.duration / 60000)}:${((track.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}\nSolicitada por: ${userName}`)
                .setThumbnail(track.thumbnail || null);
            await message.channel.send({ embeds: [embed] });
        }

        if (!player.playing && !player.paused) {
            console.log(`Reproduciendo...`);
            player.play();
        }
    } catch (error) {
        console.error(`Error al buscar "${args}": ${error.message}`);
        return sendError(message.channel, `Hubo un problema al buscar "${args}", ${userName}. Error: ${error.message}`);
    }
}

async function manejarPause(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    if (player.paused) {
        player.pause(false);
        await sendSuccess(message.channel, '▶️ ¡Música reanudada!', `La música sigue sonando, ${userName}.`);
    } else {
        player.pause(true);
        await sendSuccess(message.channel, '⏸️ ¡Música pausada!', `Pausa activada, ${userName}. Usa !pause para reanudar.`);
    }
}

async function manejarSkip(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    player.stop();
    await sendSuccess(message.channel, '⏭️ ¡Canción saltada!', `Pasamos a la siguiente, ${userName}.`);
}

async function manejarStop(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    player.destroy();
    delete dataStore.musicSessions[message.guild.id];
    dataStoreModified = true;
    await sendSuccess(message.channel, '🛑 ¡Música detenida!', `El reproductor se detuvo, ${userName}.`);
}

async function manejarQueue(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player || !player.queue.length) return sendError(message.channel, `No hay canciones en la cola, ${userName}.`);

    const queueList = player.queue.map((track, index) => 
        `${index + 1}. **${track.title}** - ${Math.floor(track.duration / 60000)}:${((track.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}`
    ).join('\n');
    const embed = createEmbed('#FFD700', '📜 Cola de reproducción',
        `Ahora: **${player.queue.current.title}**\n\n${queueList}`);
    await message.channel.send({ embeds: [embed] });
}

async function manejarRepeat(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    const args = message.content.toLowerCase().split(' ').slice(1).join(' ').trim();
    if (args === 'queue' || args === 'cola') {
        player.setQueueRepeat(!player.queueRepeat);
        await sendSuccess(message.channel, player.queueRepeat ? '🔁 ¡Repetición de cola activada!' : '▶️ ¡Repetición de cola desactivada!',
            `La cola ${player.queueRepeat ? 'se repetirá' : 'no se repetirá'} ahora, ${userName}.`);
    } else {
        player.setTrackRepeat(!player.trackRepeat);
        await sendSuccess(message.channel, player.trackRepeat ? '🔂 ¡Repetición activada!' : '▶️ ¡Repetición desactivada!',
            `La canción actual ${player.trackRepeat ? 'se repetirá' : 'no se repetirá'}, ${userName}.`);
    }
}

async function manejarBack(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);
    if (!player.queue.previous) return sendError(message.channel, `No hay canción anterior, ${userName}.`);

    player.queue.unshift(player.queue.previous);
    player.stop();
    await sendSuccess(message.channel, '⏮️ ¡Volviendo atrás!',
        `Reproduciendo la canción anterior: **${player.queue.current.title}**, ${userName}.`);
}

async function manejarAutoplay(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    const autoplayEnabled = dataStore.musicSessions[message.guild.id]?.autoplay || false;
    dataStore.musicSessions[message.guild.id] = dataStore.musicSessions[message.guild.id] || {};
    dataStore.musicSessions[message.guild.id].autoplay = !autoplayEnabled;
    dataStoreModified = true;

    await sendSuccess(message.channel, dataStore.musicSessions[message.guild.id].autoplay ? '🎵 ¡Autoplay activado!' : '⏹️ ¡Autoplay desactivado!',
        `El autoplay está ahora ${dataStore.musicSessions[message.guild.id].autoplay ? 'activado' : 'desactivado'}, ${userName}.`);
}

// Ranking con top por categoría para Trivia y Reacciones
function getCombinedRankingEmbed(userId, username) {
    const categorias = Object.keys(preguntasTriviaSinOpciones);
    
    let triviaList = '**📚 Trivia por Categoría**\n';
    categorias.forEach(categoria => {
        // Usamos triviaStats como fuente principal
        const miguelStats = dataStore.triviaStats[OWNER_ID]?.[categoria] || { correct: 0, total: 0 };
        const miguelScore = miguelStats.correct; // Puntaje es el número de correctas
        const miguelPercentage = miguelStats.total > 0 ? Math.round((miguelScore / miguelStats.total) * 100) : 0;

        const luzStats = dataStore.triviaStats[ALLOWED_USER_ID]?.[categoria] || { correct: 0, total: 0 };
        const luzScore = luzStats.correct; // Puntaje es el número de correctas
        const luzPercentage = luzStats.total > 0 ? Math.round((luzScore / luzStats.total) * 100) : 0;

        const ranking = [
            { name: 'Miguel', score: miguelScore, percentage: miguelPercentage },
            { name: 'Belén', score: luzScore, percentage: luzPercentage }
        ].sort((a, b) => b.score - a.score);

        triviaList += `\n**${categoria.charAt(0).toUpperCase() + categoria.slice(1)}** 🎲\n` +
                      ranking.map(participant => 
                          `> 🌟 ${participant.name}: **${participant.score} puntos** (${participant.percentage}% acertadas)`
                      ).join('\n') + '\n';
    });

    const miguelPPMRecord = dataStore.personalPPMRecords[OWNER_ID]?.best || { ppm: 0, timestamp: null };
    const luzPPMRecord = dataStore.personalPPMRecords[ALLOWED_USER_ID]?.best || { ppm: 0, timestamp: null };
    
    const ppmRanking = [
        { name: 'Miguel', ppm: miguelPPMRecord.ppm, timestamp: miguelPPMRecord.timestamp },
        { name: 'Belén', ppm: luzPPMRecord.ppm, timestamp: luzPPMRecord.timestamp }
    ].sort((a, b) => b.ppm - a.ppm);
    
    let ppmList = ppmRanking.map(participant => 
        participant.ppm > 0 
            ? `> ${participant.name}: **${participant.ppm} PPM** - ${new Date(participant.timestamp).toLocaleString()}`
            : `> ${participant.name}: No tiene récord aún. ¡Probá con !pp!`
    ).join('\n');

    const miguelReactionWins = dataStore.reactionWins[OWNER_ID]?.wins || 0;
    const luzReactionWins = dataStore.reactionWins[ALLOWED_USER_ID]?.wins || 0;
    
    const reactionRanking = [
        { name: 'Miguel', wins: miguelReactionWins },
        { name: 'Belén', wins: luzReactionWins }
    ].sort((a, b) => b.wins - a.wins);
    
    const reactionList = reactionRanking.map(participant => 
        `> 🌟 ${participant.name} - **${participant.wins} Reacciones**`
    ).join('\n');

    return new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 Ranking de ${username}`)
        .setDescription('¡Aquí están tus logros, ordenados por los cracks que la rompen!')
        .addFields(
            { name: '📊 Trivia', value: triviaList, inline: false },
            { name: '⌨️ PPM (Récord Más Rápido)', value: ppmList, inline: false },
            { name: '⚡ Victorias en Reacciones', value: reactionList, inline: false }
        )
        .setFooter({ text: 'Hecho por Kasper, de Oliver IA' })
        .setTimestamp();
}

async function manejarRankingPPM(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const userId = message.author.id;

    const ppmData = dataStore.personalPPMRecords[userId] || { best: { ppm: 0, timestamp: null }, attempts: [] };
    const attempts = ppmData.attempts;

    if (attempts.length === 0) {
        await sendError(message.channel, 'No tienes intentos de PPM registrados', `¡Juega con !pp para empezar, ${userName}!`);
        return;
    }

    const sortedAttempts = attempts.sort((a, b) => b.ppm - a.ppm);
    const attemptsList = sortedAttempts.map((attempt, index) => 
        `${index + 1}. **${attempt.ppm} PPM** - ${new Date(attempt.timestamp).toLocaleString()}`
    ).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`⌨️ Historial de PPM de ${userName}`)
        .setDescription(`Aquí están todos tus intentos de PPM, ordenados de mayor a menor:`)
        .addFields(
            { name: 'Intentos', value: attemptsList, inline: false },
            { name: 'Total de Intentos', value: `${attempts.length}`, inline: true },
            { name: 'Récord Más Alto', value: `${ppmData.best.ppm} PPM`, inline: true }
        )
        .setFooter({ text: 'Con cariño, Oliver IA' })
        .setTimestamp();

    await message.channel.send({ embeds: [embed] });
}

async function manejarIdea(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Luz';
    const idea = message.content.startsWith('!idea') ? message.content.slice(5).trim() : message.content.slice(3).trim();

    if (!idea) {
        return sendError(message.channel, `¡Tirame algo después de "!idea", ${userName}! ¿Qué se te ocurrió, loco?`);
    }

    // Guardar la idea en dataStore
    if (!dataStore.ideas) dataStore.ideas = [];
    dataStore.ideas.push({ autor: userName, texto: idea, timestamp: new Date().toISOString() });
    dataStoreModified = true;

    // Enviar solo al OWNER_ID (Miguel) por MD
    const owner = await client.users.fetch(OWNER_ID);
    const ideaEmbed = createEmbed('#FFD700', `💡 Nueva idea de ${userName}`, 
        `${userName} dice: "${idea}"\nGuardada el: ${new Date().toLocaleString()}`);

    try {
        await owner.send({ embeds: [ideaEmbed] });
        await sendSuccess(message.channel, '✅ ¡Idea guardada!', 
            `Ya la anoté y te la mandé por MD, ${userName}. ¡Buena esa!`);
    } catch (error) {
        console.error('Error al enviar idea:', error);
        await sendError(message.channel, '❌ No pude mandar la idea', 
            `Algo falló, ${userName}. Error: ${error.message}. ¿Probamos de nuevo?`);
    }
}

async function manejarDato(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!dato') 
        ? message.content.slice(5).trim() 
        : message.content.slice(3).trim();

    if (!args) {
        return sendError(message.channel, `¡Tirame algo después de "!dato", ${userName}! ¿Qué querés saber, loco?`);
    }

    const waitingEmbed = createEmbed('#55FFFF', `⌛ Buscando, ${userName}...`, 
        `Dame un segundo que ya te traigo el dato de "${args}"...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        const cx = process.env.GOOGLE_CX;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(args)}&num=1`;
        const response = await axios.get(url);
        const result = response.data.items;

        let reply = '';
        if (!result || result.length === 0) {
            throw new Error('No encontré nada posta, che.');
        } else {
            reply = result[0].snippet || 'No hay descripción, pero te lo resumo al toque.';
        }

        reply = reply.length > 200 ? `${reply.slice(0, 197)}...` : reply;

        const embed = createEmbed('#FFD700', `📜 Dato sobre "${args}"`, 
            `${reply}\n\n*Lo saqué de la web, che.*`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error buscando "${args}": ${error.message}`);
        const errorEmbed = createEmbed('#FF5555', '¡Qué cagada!', 
            `No pude encontrar nada sobre "${args}", ${userName}. ¿Probamos con otra cosa, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

async function manejarClima(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!clima') 
        ? message.content.slice(6).trim() 
        : message.content.slice(3).trim();

    if (!args) {
        return sendError(message.channel, `¡Decime una ciudad después de "!clima", ${userName}! Ejemplo: !clima Córdoba`);
    }

    const waitingEmbed = createEmbed('#55FFFF', `⛅ Chequeando el clima, ${userName}...`, 
        `Aguantá que veo cómo está "${args}"...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(args)}&appid=${apiKey}&units=metric&lang=es`;
        const response = await axios.get(url);
        const data = response.data;

        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        const city = data.name;
        const country = data.sys.country;
        const vibe = temp > 25 ? "pa’l asado" : temp < 10 ? "pa’ un mate calentito" : "tranqui";

        const embed = createEmbed('#FFD700', `⛅ Clima en ${city}, ${country}`, 
            `${temp}°C, ${desc}, ${vibe}.`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error en clima para "${args}": ${error.message}`);
        const errorEmbed = createEmbed('#FF5555', '¡Qué cagada!', 
            `No pude encontrar el clima de "${args}", ${userName}. ¿Seguro que existe esa ciudad, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

async function manejarNoticias(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    const waitingEmbed = createEmbed('#55FFFF', `📰 Buscando noticias, ${userName}...`, 
        `Aguantá que te traigo lo último de Argentina y Ecuador al toque...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const apiKey = process.env.MEDIASTACK_API_KEY;
        if (!apiKey) throw new Error('Falta la clave de Mediastack en el .env, loco.');

        // Fecha de hoy para filtrar noticias recientes (formato YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Noticias de Argentina
        const urlAR = `http://api.mediastack.com/v1/news?access_key=${apiKey}&countries=ar&languages=es&limit=5&date=${today}&sort=published_desc`;
        console.log(`Pidiendo noticias de Argentina a: ${urlAR}`);
        const responseAR = await axios.get(urlAR);
        const articlesAR = responseAR.data.data || [];

        // Noticias de Ecuador
        const urlEC = `http://api.mediastack.com/v1/news?access_key=${apiKey}&countries=ec&languages=es&limit=5&date=${today}&sort=published_desc`;
        console.log(`Pidiendo noticias de Ecuador a: ${urlEC}`);
        const responseEC = await axios.get(urlEC);
        const articlesEC = responseEC.data.data || [];

        console.log('Respuesta AR:', JSON.stringify(responseAR.data, null, 2));
        console.log('Respuesta EC:', JSON.stringify(responseEC.data, null, 2));

        if (articlesAR.length === 0 && articlesEC.length === 0) {
            throw new Error('No encontré noticias de hoy ni de Argentina ni de Ecuador, qué cagada.');
        }

        // Formateamos noticias de Argentina
        let noticiasAR = 'No encontré noticias posta de Argentina hoy, loco.';
        if (articlesAR.length > 0) {
            noticiasAR = articlesAR.slice(0, 5).map((article, index) => 
                `${index + 1}. **${article.title}**\n${article.description ? article.description.slice(0, 150) + '...' : 'Sin descripción.'}\n*Fuente: ${article.source}*`
            ).join('\n\n');
        }

        // Formateamos noticias de Ecuador
        let noticiasEC = 'No encontré noticias posta de Ecuador hoy, loco.';
        if (articlesEC.length > 0) {
            noticiasEC = articlesEC.slice(0, 5).map((article, index) => 
                `${index + 1}. **${article.title}**\n${article.description ? article.description.slice(0, 150) + '...' : 'Sin descripción.'}\n*Fuente: ${article.source}*`
            ).join('\n\n');
        }

        // Creamos el embed con más detalles
        const embed = createEmbed('#FFD700', `📰 Últimas Noticias de Hoy (${today})`, 
            `**Argentina:**\n${noticiasAR}\n\n**Ecuador:**\n${noticiasEC}\n\n*Traído con onda desde Mediastack, che.*`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error en noticias: ${error.message}`);
        if (error.response) {
            console.error(`Respuesta de la API: ${JSON.stringify(error.response.data)}`);
        }
        const errorEmbed = createEmbed('#FF5555', '¡Qué quilombo!', 
            `No pude traer noticias copadas, ${userName}. Error: ${error.message}. ¿Probamos de nuevo, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

async function manejarWiki(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!wiki') 
        ? message.content.slice(5).trim() 
        : message.content.slice(3).trim();

    if (!args) {
        return sendError(message.channel, `¡Tirame algo después de "!wiki", ${userName}! Ejemplo: !wiki tango`);
    }

    const waitingEmbed = createEmbed('#55FFFF', `📖 Buscando en Wiki, ${userName}...`, 
        `Aguantá que te traigo info de "${args}"...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args)}`;
        const response = await axios.get(url);
        const data = response.data;

        const summary = data.extract.length > 200 
            ? `${data.extract.slice(0, 197)}...` 
            : data.extract;

        const embed = createEmbed('#FFD700', `📖 Sobre "${data.title}"`, 
            `${summary}\n*Sacado de Wikipedia, posta.*`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error en wiki para "${args}": ${error.message}`);
        const errorEmbed = createEmbed('#FF5555', '¡Qué cagada!', 
            `No encontré nada en Wikipedia sobre "${args}", ${userName}. ¿Probamos otra cosa, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

async function manejarTraduci(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!traducí') 
        ? message.content.slice(8).trim().split(' a ') 
        : message.content.slice(3).trim().split(' a ');
    const text = args[0].trim(); // Asegurate de que no haya basura como "aduci"

    if (args.length < 2) {
        return sendError(message.channel, `¡Escribí algo como "!traducí hola a inglés", ${userName}!`);
    }

    const text = args[0].trim();
    const targetLang = args[1].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const waitingEmbed = createEmbed('#55FFFF', `✍️ Traduciendo, ${userName}...`, 
        `Aguantá que traduzco "${text}" a ${targetLang}...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const langMap = {
            'ingles': 'en',
            'español': 'es',
            'espanol': 'es',
            'frances': 'fr',
            'italiano': 'it',
            'portugues': 'pt',
            'aleman': 'de',
            'ruso': 'ru'
        };
        const langCode = langMap[targetLang];

        if (!langCode) {
            throw new Error(`No sé traducir a "${targetLang}", ${userName}. Probá con "inglés", "ruso", "francés", etc.`);
        }

        // Usamos una API alternativa porque MyMemory está fallando
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
        console.log(`Pidiendo traducción a Google Translate: ${url}`);
        const response = await axios.get(url);

        console.log('Respuesta de Google Translate:', JSON.stringify(response.data, null, 2));

        const translated = response.data[0][0][0]; // Google devuelve un array raro, esto saca el texto traducido

        if (!translated || translated.toLowerCase() === text.toLowerCase()) {
            throw new Error(`¡Qué boludo! La traducción salió igual que el original: "${translated}". ¿La API está rota o qué?`);
        }

        const embed = createEmbed('#FFD700', `✅ Traducción a ${targetLang.charAt(0).toUpperCase() + targetLang.slice(1)}`, 
            `"${text}" → **${translated}**\n*Traducido con onda desde español, che.*`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error traduciendo "${text}" a "${targetLang}": ${error.message}`);
        if (error.response) {
            console.error(`Respuesta de la API: ${JSON.stringify(error.response.data)}`);
        }
        const errorEmbed = createEmbed('#FF5555', '¡Qué cagada!', 
            `${error.message}`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Eventos de música con Erela.js
manager.on('nodeConnect', node => console.log(`Nodo ${node.options.identifier} conectado.`));
manager.on('nodeError', (node, error) => console.error(`Error en nodo ${node.options.identifier}: ${error.message}`));
manager.on('trackStart', async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    const guildId = player.guild;
    
    // Guardar el identifier del track actual
    dataStore.musicSessions[guildId] = dataStore.musicSessions[guildId] || {};
    dataStore.musicSessions[guildId].lastTrackIdentifier = track.identifier;
    dataStoreModified = true;
    console.log(`Track started: ${track.title}, identifier saved: ${track.identifier}`);

    if (channel) {
        const embed = createEmbed('#00FF00', '▶️ ¡Reproduciendo ahora!',
            `**${track.title}**\nDuración: ${Math.floor(track.duration / 60000)}:${((track.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}`)
            .setThumbnail(track.thumbnail || null);
        await channel.send({ embeds: [embed] });
    }
});
manager.on('queueEnd', async player => {
    const channel = client.channels.cache.get(player.textChannel);
    const guildId = player.guild;
    const autoplay = dataStore.musicSessions[guildId]?.autoplay || false;

    if (autoplay && channel) {
        try {
            let trackIdentifier = null;

            // Intento 1: Usar currentTrack
            const currentTrack = player.queue.current;
            console.log(`queueEnd: currentTrack = ${JSON.stringify(currentTrack)}`);
            if (currentTrack && currentTrack.identifier) {
                trackIdentifier = currentTrack.identifier;
            } else {
                // Intento 2: Usar previousTrack
                const previousTrack = player.queue.previous;
                console.log(`currentTrack nulo, intentando previousTrack = ${JSON.stringify(previousTrack)}`);
                if (previousTrack && previousTrack.identifier) {
                    trackIdentifier = previousTrack.identifier;
                    await channel.send({ embeds: [createEmbed('#FFAA00', 'ℹ️ Autoplay ajustado', 
                        'No hay canción actual, usando la anterior para continuar.')] });
                } else {
                    // Intento 3: Usar el último identifier guardado
                    const lastIdentifier = dataStore.musicSessions[guildId]?.lastTrackIdentifier;
                    console.log(`previousTrack nulo, intentando lastTrackIdentifier = ${lastIdentifier}`);
                    if (lastIdentifier) {
                        trackIdentifier = lastIdentifier;
                        await channel.send({ embeds: [createEmbed('#FFAA00', 'ℹ️ Autoplay ajustado', 
                            'No hay canciones recientes, usando el último registro para continuar.')] });
                    }
                }
            }

            if (!trackIdentifier) {
                await channel.send({ embeds: [createEmbed('#FF5555', '⚠️ Autoplay detenido', 
                    'No hay canciones recientes para buscar relacionadas. Usa !pl para añadir más música.')] });
                return; // No destruimos el player, permitimos que siga vivo
            }

            const related = await manager.search(`related:${trackIdentifier}`, client.user);
            console.log(`Búsqueda relacionada: ${related.loadType}, tracks: ${related.tracks.length}`);
            
            if (related.tracks.length > 0) {
                const nextTrack = related.tracks[0];
                player.queue.add(nextTrack);
                player.play();
                const embed = createEmbed('#00FF00', '🎵 ¡Autoplay en acción!',
                    `Añadí **${nextTrack.title}** automáticamente.\nDuración: ${Math.floor(nextTrack.duration / 60000)}:${((nextTrack.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}`)
                    .setThumbnail(nextTrack.thumbnail || null);
                await channel.send({ embeds: [embed] });
                return;
            } else {
                await channel.send({ embeds: [createEmbed('#FF5555', '⚠️ Autoplay falló', 
                    'No encontré canciones relacionadas. Usa !pl para continuar.')] });
            }
        } catch (error) {
            console.error(`Error en autoplay: ${error.message}`);
            await channel.send({ embeds: [createEmbed('#FF5555', '⚠️ Error en Autoplay', 
                `Algo salió mal: ${error.message}. Intenta con !pl.`)] });
        }
    }

    if (channel) {
        await channel.send({ embeds: [createEmbed('#FF5555', '🏁 Cola terminada', 
            'No hay más canciones. ¡Añade más con !pl!')] });
    }
    // Solo destruimos el player si el autoplay está desactivado
    if (!autoplay) {
        player.destroy();
        delete dataStore.musicSessions[player.guild];
        dataStoreModified = true;
    }
});

// Comandos
async function manejarCommand(message) {
    const content = message.content.toLowerCase();
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    console.log(`Comando recibido: ${content}`);

    // Prioridad absoluta para !responder
    if (message.author.id === OWNER_ID && (content.startsWith('!responder') || content.startsWith('!resp'))) {
        await manejarResponder(message);
        return; // Salimos para no procesar más
    }
    
    // Cancelar trivia
    if (content === '!trivia cancelar' || content === '!tc') {
        if (message.author.id !== OWNER_ID && message.author.id !== ALLOWED_USER_ID) return;

        const channelProgress = dataStore.activeSessions[`trivia_${message.channel.id}`];
        if (!channelProgress || channelProgress.type !== 'trivia') {
            await sendError(message.channel, `No hay ninguna trivia activa para cancelar, ${userName}.`, 
                '¿Querés arrancar una con !trivia?');
            return;
        }

        delete dataStore.activeSessions[`trivia_${message.channel.id}`];
        activeTrivia.delete(message.channel.id);
        dataStoreModified = true;

        await sendSuccess(message.channel, '🛑 ¡Trivia cancelada!', 
            `Listo, ${userName}, cortaste la trivia al toque. Puntuación parcial: ${channelProgress.score}/${channelProgress.currentQuestion}. ¿Arrancamos otra con !trivia?`);
        return; // Salimos para no procesar más
    } 
    // Cancelar reacciones
    else if (content === '!reacciones cancelar' || content === '!rc') {
        if (message.author.id !== OWNER_ID && message.author.id !== ALLOWED_USER_ID) return;

        const session = dataStore.activeSessions[`reaction_${message.channel.id}`];
        if (!session || session.type !== 'reaction' || session.completed) {
            await sendError(message.channel, `No hay un juego de reacciones activo para cancelar, ${userName}.`, 
                '¿Querés empezar uno con !reacciones?');
            return;
        }

        session.completed = true;
        delete dataStore.activeSessions[`reaction_${message.channel.id}`];
        dataStoreModified = true;

        await sendSuccess(message.channel, '🛑 ¡Juego de reacciones cancelado!', 
            `Listo, ${userName}, cortaste el juego al toque. Puntuación parcial: ${session.score} en ${session.currentRound - 1} rondas. ¿Arrancamos otro con !reacciones?`);
        return; // Salimos para no procesar más
    } 
    // Cancelar PPM
    else if (content === '!ppm cancelar' || content === '!pc') {
        if (message.author.id !== OWNER_ID && message.author.id !== ALLOWED_USER_ID) return;

        const ppmKey = `ppm_${message.author.id}`;
        const session = dataStore.activeSessions[ppmKey];
        if (!session || session.type !== 'ppm' || session.completed) {
            await sendError(message.channel, `No hay PPM activo, ${userName}.`, '¿Querés uno con !ppm?');
        } else {
            session.active = false;
            delete dataStore.activeSessions[ppmKey];
            dataStoreModified = true;
            await sendSuccess(message.channel, '🛑 ¡PPM cancelado!', `Listo, ${userName}. Paraste antes de terminar.`);
        }
        return;
    }
    else if (content.startsWith('!traduci') || content.startsWith('!ts')) {
    await manejarTraduci(message);
    }
    else if (content === '!trivia' || content === '!tc') {
        await manejarTrivia(message);
    } 
    else if (content.startsWith('!reacciones') || content.startsWith('!re')) {
        await manejarReacciones(message);
    } 
    else if (content.startsWith('!chat') || content.startsWith('!ch')) {
        await manejarChat(message);
    } 
    else if (content === '!ppm' || content === '!pp') {
        await manejarPPM(message);
    } 
    else if (content === '!actualizaciones' || content === '!act') {
        await manejarActualizaciones(message);
    } 
    else if (content === '!luz') {
        const mensaje = mensajesAnimo[Math.floor(Math.random() * mensajesAnimo.length)];
        const embed = createEmbed('#FFAA00', `¡Ánimo, ${userName}!`, mensaje);
        await message.channel.send({ embeds: [embed] });
    } 
    else if (content === '!save') {
        try {
            const saved = await saveDataStore();
            if (saved) {
                await sendSuccess(message.channel, '💾 ¡Guardado!', `Datos guardados exitosamente, ${userName}.`);
                dataStoreModified = false;
            } else {
                await sendSuccess(message.channel, '💾 Sin Cambios', `No hay cambios para guardar, ${userName}.`);
            }
        } catch (error) {
            await sendError(message.channel, '💾 Error al guardar', `No pude guardar los datos, ${userName}. Error: ${error.message}`);
        }
    } 
    else if (content.startsWith('!sugerencias') || content.startsWith('!su')) {
        await manejarSugerencias(message);
    } 
    else if (content.startsWith('!ayuda') || content.startsWith('!ay')) {
        await manejarAyuda(message);
    } 
    else if (content === '!rankingppm' || content === '!rppm') {
        await manejarRankingPPM(message);
    } 
    else if (content.startsWith('!play') || content.startsWith('!pl')) {
        await manejarPlay(message);
    } 
    else if (content === '!pause' || content === '!pa') {
        await manejarPause(message);
    } 
    else if (content === '!skip' || content === '!sk') {
        await manejarSkip(message);
    } 
    else if (content === '!stop' || content === '!st') {
        await manejarStop(message);
    } 
    else if (content === '!queue' || content === '!qu') {
        await manejarQueue(message);
    } 
    else if (content === '!repeat' || content === '!rp') {
        await manejarRepeat(message);
    } 
    else if (content === '!back' || content === '!bk') {
        await manejarBack(message);
    } 
    else if (content === '!autoplay' || content === '!ap') {
        await manejarAutoplay(message);
    } 
    else if (content === '!autosave' || content === '!as') {
        await manejarAutosave(message);
    } 
    else if (content === '!lyrics' || content === '!ly') {
        await manejarLyrics(message);
    } 
    else if (content.startsWith('!responder') || content.startsWith('!resp')) {
        await manejarResponder(message);
    }
    else if (content.startsWith('!idea') || content.startsWith('!id')) {
        await manejarIdea(message);
    }    
    else if (content.startsWith('!dato') || content.startsWith('!dt')) {
        await manejarDato(message);
    } 
    else if (content.startsWith('!clima')) {
        await manejarClima(message);
    } 
    else if (content === '!noticias') {
        await manejarNoticias(message);
    } 
    else if (content.startsWith('!wiki')) {
        await manejarWiki(message);
    }
    else if (content.startsWith('!imagen') || content.startsWith('!im')) {
        await manejarImagen(message);
    }
    else if (content.startsWith('!misimagenes') || content.startsWith('!mi')) {
        await manejarMisImagenes(message);
    }
    else if (content.startsWith('!editarimagen') || content.startsWith('!ei')) {
        await manejarEditarImagen(message);
    }
    else if (content.startsWith('!ansiedad') || content.startsWith('!an')) {
        await manejarAnsiedad(message);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userName = message.author.id === OWNER_ID ? 'Miguel' : (message.author.id === ALLOWED_USER_ID ? 'Belén' : 'Un desconocido');
    const content = message.content.toLowerCase();

    // Detectar si gritan demasiado con mayúsculas (Miguel o Belén)
    const lettersOnly = message.content.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (lettersOnly.length > 5 && (message.author.id === OWNER_ID || message.author.id === ALLOWED_USER_ID)) {
        const uppercaseCount = lettersOnly.split('').filter(char => char === char.toUpperCase()).length;
        const uppercasePercentage = (uppercaseCount / lettersOnly.length) * 100;
        if (uppercasePercentage >= 80) {
            try {
                await message.delete();
                const member = message.guild?.members.cache.get(message.author.id);
                if (member && message.guild?.members.me.permissions.has('MODERATE_MEMBERS')) {
                    await member.timeout(5 * 60 * 1000, 'Te pasaste con las mayúsculas, loco');
                    await message.channel.send({ 
                        embeds: [createEmbed('#FF5555', '⛔ ¡Pará un poco, che!', 
                            `¡${userName} se mandó un griterío con mayúsculas y se comió 5 minutos de mute! Nada de hacer lío, ¿eh?`)] 
                    });
                } else {
                    await message.channel.send({ 
                        embeds: [createEmbed('#FF5555', '⛔ ¡No pude muteartelo, boludo!', 
                            `¡${userName} gritó todo en mayúsculas, pero no tengo permisos para muteartelo! Igual borré el mensaje, tranqui.`)] 
                    });
                }
            } catch (error) {
                console.error('Error al mutear:', error.message);
                await message.channel.send({ 
                    embeds: [createEmbed('#FF5555', '⛔ ¡Qué quilombo!', 
                        `¡${userName} usó un montón de mayúsculas, pero la cagué muteándolo/a! Error: ${error.message}. El mensaje ya se fue, relajá.`)] 
                });
            }
            return;
        }
    }

    if (message.author.id === OWNER_ID && (content.startsWith('!responder') || content.startsWith('!resp'))) {
        await manejarCommand(message);
        return;
    }

    if (message.author.id !== OWNER_ID && message.author.id !== ALLOWED_USER_ID) return;

    if (processedMessages.has(message.id)) return;
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

    // Cancelaciones con prioridad absoluta
    if (content === '!tc' || content === '!trivia cancelar') {
        const triviaKey = `trivia_${message.channel.id}`;
        const session = dataStore.activeSessions[triviaKey];
        if (!session || session.type !== 'trivia') {
            await sendError(message.channel, `No hay trivia activa, ${userName}.`, '¿Querés una con !trivia?');
        } else {
            session.active = false;
            delete dataStore.activeSessions[triviaKey];
            activeTrivia.delete(message.channel.id);
            dataStoreModified = true;
            await sendSuccess(message.channel, '🛑 ¡Trivia cancelada!', `Listo, ${userName}. Puntuación: ${session.score}/${session.currentQuestion}.`);
        }
        return;
    }

    if (content === '!rc' || content === '!reacciones cancelar') {
        const reactionKey = `reaction_${message.channel.id}`;
        const session = dataStore.activeSessions[reactionKey];
        if (!session || session.type !== 'reaction' || session.completed) {
            await sendError(message.channel, `No hay reacciones activas, ${userName}.`, '¿Arrancamos con !reacciones?');
        } else {
            session.active = false; // Marcamos como inactiva
            session.completed = true;
            delete dataStore.activeSessions[reactionKey];
            dataStoreModified = true;
            await sendSuccess(message.channel, '🛑 ¡Reacciones canceladas!', `Listo, ${userName}. Puntuación: ${session.score}.`);
        }
        return;
    }

    if (content === '!pc' || content === '!ppm cancelar') {
        const ppmKey = `ppm_${message.author.id}`;
        const session = dataStore.activeSessions[ppmKey];
        if (!session || session.type !== 'ppm' || session.completed) {
            await sendError(message.channel, `No hay PPM activo, ${userName}.`, '¿Querés uno con !ppm?');
        } else {
            session.active = false;
            delete dataStore.activeSessions[ppmKey];
            dataStoreModified = true;
            await sendSuccess(message.channel, '🛑 ¡PPM cancelado!', `Listo, ${userName}. Paraste antes de terminar.`);
        }
        return;
    }

    // Otros comandos después
    await manejarCommand(message);
    if (content === '!ranking' || content === '!rk') {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!help' || content === '!h') {
        const embed = createEmbed('#55FF55', `¡Lista de comandos para vos, ${userName}!`,
            '¡Acá tenés todo lo que puedo hacer por vos, loco!\n' +
            '- **!ch / !chat [mensaje]**: Charlamos un rato, posta.\n' +
            '- **!tr / !trivia [categoría] [n]**: Trivia copada por categoría (mínimo 20).\n' +
            '- **!tc / !trivia cancelar**: Cancela la trivia que empezaste.\n' +             
            '- **!pp / !ppm**: A ver qué tan rápido tipeás, ¡dale!\n' +
            '- **!pc / !ppm cancelar**: Cancela el PPM si te arrepentís.\n' +
            '- **!rk / !ranking**: Tus puntajes y estadísticas (récord más alto de PPM).\n' +
            '- **!rppm / !rankingppm**: Todos tus intentos de PPM, loco.\n' +
            '- **!re / !reacciones**: Juego para ver quién tipea más rápido.\n' +
            '- **!rc / !reacciones cancelar**: Cancela las reacciones que empezaste.\n' +            
            '- **!su / !sugerencias [sugerencia]**: Mandame tus sugerencias para hacer este bot más piola.\n' +
            '- **!id / !idea [texto]**: Tirame una idea rápida pa’ mejorar el bot, ¡dale!\n' + 
            '- **!ay / !ayuda [problema]**: Pedile una mano a Miguel.\n' +
            '- **!save**: Guardo todo al toque, tranqui.\n' +
            '- **!as / !autosave**: Paro o arranco el guardado automático.\n' +
            '- **!act / !actualizaciones**: Mirá las últimas novedades del bot.\n' +
            '- **!dt / !dato [pregunta]**: Te busco un dato rápido en la web o X, ¡posta!\n' +
            '- **!clima [ciudad]**: Te digo el clima de cualquier ciudad, re útil.\n' +
            '- **!noticias**: Te traigo el último titular de Argentina, al toque.\n' +
            '- **!wiki [término]**: Busco un resumen en Wikipedia, ¡copado!\n' +
            '- **!traduci [frase] a [idioma]**: Traduzco frases cortas, joya pa’ practicar.\n' +
            '- **!an / !ansiedad**: Tips rápidos pa’ calmar la ansiedad, con un mensaje especial de Miguel pa’ darte pilas.\n' +
            '- **!h / !help**: Esta lista, che.\n' +
            '- **!hm / !help musica**: Comandos para meterle música al día.\n' +
            '- **hola**: Te tiro un saludito con onda.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!help musica' || content === '!hm') {
        const embed = createEmbed('#55FF55', `¡Comandos de música para vos, ${userName}!`,
            '¡Poné el ritmo con estos comandos, loco!\n' +
            '- **!pl / !play [canción/URL]**: Tiro un tema para que suene.\n' +
            '- **!pa / !pause**: Pauso o sigo la música, vos elegís.\n' +
            '- **!sk / !skip**: Salto al próximo tema, al toque.\n' +
            '- **!st / !stop**: Corto todo, silencio total.\n' +
            '- **!qu / !queue**: Te muestro la lista de temas que vienen.\n' +
            '- **!rp / !repeat [cola]**: Repito el tema o toda la cola, ¿qué querés?\n' +
            '- **!bk / !back**: Vuelvo al tema anterior, como en los viejos tiempos.\n' +
            '- **!ap / !autoplay**: Prendo o apago el autoplay, re práctico.\n' +
            '- **!ly / !lyrics [canción]**: Te traigo la letra del tema que suena o uno que me digas.\n' +
            '- **!hm / !help musica**: Esta guía de música, posta.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === 'hola') {
        const embed = createEmbed('#55FFFF', `¡Qué lindo verte, ${userName}!`,
            `¡Hola, loco! Soy Oliver IA, tu compañero piola, trayéndote buena onda como si estuviéramos tomando mate en la vereda. ¿Cómo estás hoy, che? Estoy listo para charlar, ayudarte o tirar unas pavadas para reírnos. ¿Qué tenés en mente? ¡Dale, arrancamos!`);
        await message.channel.send({ embeds: [embed] });
    }
});

// Eventos
client.once('ready', async () => {
    console.log(`¡Miguel IA está listo! Instancia: ${instanceId} - ${new Date().toLocaleString('es-AR')}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudar a Milagros", type: 0 }], status: 'dnd' });
    dataStore = await loadDataStore();
    activeTrivia = new Map(Object.entries(dataStore.activeSessions).filter(([_, s]) => s.type === 'trivia'));
    manager.init(client.user.id);
    if (!dataStore.musicSessions) {
        dataStore.musicSessions = {};
        console.log('musicSessions no estaba presente, inicializado manualmente');
    }

    // Inicializar utilMessageTimestamps y utilMessageReactions si no existen
    if (!dataStore.utilMessageTimestamps) dataStore.utilMessageTimestamps = {};
    if (!dataStore.utilMessageReactions) dataStore.utilMessageReactions = {};
    
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) throw new Error('Canal no encontrado');

        const userHistory = dataStore.conversationHistory[ALLOWED_USER_ID] || [];
        const historySummary = userHistory.length > 0
            ? userHistory.slice(-3).map(msg => `${msg.role === 'user' ? 'Luz' : 'Yo'}: ${msg.content}`).join('\n')
            : 'No hay historial reciente.';
        const argentinaTime = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

        // Inicializamos sentUpdates si no existe en dataStore
        if (!dataStore.sentUpdates) {
            dataStore.sentUpdates = [];
            dataStoreModified = true;
        }

        // Comparamos BOT_UPDATES con lo que ya se envió
        const updatesChanged = JSON.stringify(BOT_UPDATES) !== JSON.stringify(dataStore.sentUpdates);

        if (updatesChanged) {
            const updateEmbed = createEmbed('#FFD700', '📢 Actualizaciones de Oliver IA',
                '¡Tengo mejoras nuevas para compartir contigo!');

            const updatesText = BOT_UPDATES.map(update => `- ${update}`).join('\n');
            const maxFieldLength = 1024;
            let currentField = '';
            let fieldCount = 1;
            const fields = [];

            updatesText.split('\n').forEach(line => {
                if (currentField.length + line.length + 1 > maxFieldLength) {
                    fields.push({ name: `Novedades (Parte ${fieldCount})`, value: currentField.trim(), inline: false });
                    currentField = line;
                    fieldCount++;
                } else {
                    currentField += (currentField ? '\n' : '') + line;
                }
            });
            if (currentField) {
                fields.push({ name: `Novedades (Parte ${fieldCount})`, value: currentField.trim(), inline: false });
            }

            fields.forEach(field => updateEmbed.addFields(field));
            updateEmbed.addFields({ name: 'Hora de actualización', value: `${argentinaTime}`, inline: false });

            await channel.send({ content: `<@${ALLOWED_USER_ID}>`, embeds: [updateEmbed] });
            
            dataStore.sentUpdates = [...BOT_UPDATES];
            dataStoreModified = true;
            await saveDataStore();
            console.log('Actualizaciones enviadas y guardadas en sentUpdates.');
        } else {
            console.log('No hay cambios en BOT_UPDATES respecto a sentUpdates, no se envían.');
        }

        // Intervalo para enviar mensaje útil diario
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        const checkInterval = 60 * 60 * 1000; // Chequear cada hora

        setInterval(async () => {
            try {
                const now = Date.now();
                const lastSent = dataStore.utilMessageTimestamps[CHANNEL_ID] || 0;
                const lastReaction = dataStore.utilMessageReactions[CHANNEL_ID] || 0;

                if (now - lastSent >= oneDayInMs && (!lastReaction || now - lastReaction >= oneDayInMs)) {
                    const dailyUtilEmbed = createEmbed('#55FFFF', '¡Che, Belén!', 
                        '¿Te estoy siendo útil, grosa? ¡Contame cómo te va conmigo, dale!', 
                        'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
                    const sentMessage = await channel.send({ embeds: [dailyUtilEmbed] });

                    await sentMessage.react('✅');
                    await sentMessage.react('❌');

                    dataStore.utilMessageTimestamps[CHANNEL_ID] = now;
                    sentMessages.set(sentMessage.id, { content: dailyUtilEmbed.description, message: sentMessage });
                    dataStoreModified = true;
                    await saveDataStore();
                    console.log(`Mensaje útil diario enviado al canal ${CHANNEL_ID} - ${new Date().toLocaleString('es-AR')}`);
                }
            } catch (error) {
                console.error('Error en el intervalo de mensaje útil:', error.message);
            }
        }, checkInterval);

        // Enviar mensaje al iniciar si no se envió hoy
        const now = Date.now();
        const lastSent = dataStore.utilMessageTimestamps[CHANNEL_ID] || 0;
        const lastReaction = dataStore.utilMessageReactions[CHANNEL_ID] || 0;
        if (now - lastSent >= oneDayInMs && (!lastReaction || now - lastReaction >= oneDayInMs)) {
            const utilEmbed = createEmbed('#55FFFF', '¡Che, Belén!', 
                '¿Te estoy siendo útil, grosa? ¡Contame cómo te va conmigo, dale!', 
                'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
            const sentMessage = await channel.send({ embeds: [utilEmbed] });

            await sentMessage.react('✅');
            await sentMessage.react('❌');

            dataStore.utilMessageTimestamps[CHANNEL_ID] = now;
            sentMessages.set(sentMessage.id, { content: utilEmbed.description, message: sentMessage });
            dataStoreModified = true;
            await saveDataStore();
            console.log(`Mensaje útil enviado al iniciar - ${new Date().toLocaleString('es-AR')}`);
        }

    } catch (error) {
        console.error('Error al enviar actualizaciones o configurar mensaje útil:', error);
    }
});

process.on('beforeExit', async () => {
    console.log('Guardando datos antes de salir...');
    await saveDataStore();
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (!sentMessages.has(reaction.message.id)) return;
    if (![OWNER_ID, ALLOWED_USER_ID].includes(user.id)) return;

    const messageData = sentMessages.get(reaction.message.id);
    const userName = user.id === OWNER_ID ? 'Miguel' : 'Belén';

    // Configuración de Google Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    if (user.id === ALLOWED_USER_ID && (reaction.emoji.name === '✅' || reaction.emoji.name === '❌')) {
        // Guardar la reacción de Belén
        dataStore.utilMessageReactions[CHANNEL_ID] = Date.now();
        dataStoreModified = true;
        await saveDataStore();
        console.log(`Belén reaccionó con ${reaction.emoji.name} - ${new Date().toLocaleString('es-AR')}`);

        // Responder según la reacción
        if (reaction.emoji.name === '✅') {
            await reaction.message.channel.send({ embeds: [createEmbed('#55FFFF', '¡Genia, Belén!', 
                '¡Gracias por el visto, grosa! Nos vemos mañana, ¿dale?', 'Con cariño, Oliver IA')] });
        } else if (reaction.emoji.name === '❌') {
            await reaction.message.channel.send({ embeds: [createEmbed('#FF5555', '¡Uy, Belén!', 
                '¿No te copó, genia? Contame qué pasa, ¡dale!', 'Con cariño, Oliver IA')] });
        }
        sentMessages.delete(reaction.message.id); // Evitar procesar de nuevo
    }

    if (reaction.emoji.name === '❌' && messageData.originalQuestion) {
        const originalQuestion = messageData.originalQuestion;

        const waitingEmbed = createEmbed('#55FFFF', `¡Aguantá un toque, ${userName}!`, 
            'Estoy pensando una respuesta más copada...', 'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
        const waitingMessage = await reaction.message.channel.send({ embeds: [waitingEmbed] });

        try {
            const prompt = `Sos Oliver IA, creado por Miguel, un loco re piola. La primera respuesta a "${originalQuestion}" no le copó al usuario. Probá de nuevo con una respuesta más copada, detallada y útil, usando palabras argentinas como "copado", "joya", "boludo", "re", "dale", "posta" o "genial". Si es para Belén, hablale con cariño como "grosa" o "genia". Respondé solo lo que te piden, con info posta, sin chamuyo. Sé claro y relajado en español. Terminá con buena onda pa’ seguir la charla, tipo "¿Te cerró, ${userName}?".`;
            
            const result = await model.generateContent(prompt);
            let aiReply = result.response.text().trim();

            if (aiReply.length > 2000) aiReply = aiReply.slice(0, 1990) + '... (seguí charlando pa’ más, loco)';
            aiReply += `\n\n¿Te cerró esta vez, ${userName}? ¿Seguimos charlando, loco?`;

            const alternativeEmbed = createEmbed('#55FFFF', `¡Segunda chance, ${userName}!`, 
                aiReply, 'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
            const newMessage = await waitingMessage.edit({ embeds: [alternativeEmbed] });
            await newMessage.react('✅');
            await newMessage.react('❌');
            sentMessages.set(newMessage.id, { content: aiReply, originalQuestion: originalQuestion, message: newMessage });
            sentMessages.delete(reaction.message.id);
        } catch (error) {
            console.error('Error con Gemini:', error.message);
            const fallbackReply = `¡Uy, ${userName}, qué cagada! Me mandé un moco, loco. Error: ${error.message}. ¿Me tirás más detalles para sacarla bien esta vez?`;
            const errorEmbed = createEmbed('#FF5555', '¡Qué cagada, che!', 
                `${fallbackReply}\n\n¿Te cerró esta vez, ${userName}? ¿Seguimos charlando, loco?]`, 
                'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
            const errorMessageSent = await waitingMessage.edit({ embeds: [errorEmbed] });
            await errorMessageSent.react('✅');
            await errorMessageSent.react('❌');
            sentMessages.set(errorMessageSent.id, { content: fallbackReply, originalQuestion: originalQuestion, message: errorMessageSent });
            sentMessages.delete(reaction.message.id);
        }
    }

    if (user.id === ALLOWED_USER_ID) {
        const owner = await client.users.fetch(OWNER_ID);
        const reactionEmbed = createEmbed('#FFD700', '¡Belén le puso pilas!', 
            `Belén reaccionó con ${reaction.emoji} a: "${messageData.content}"\nPregunta original: "${messageData.originalQuestion || 'Mensaje diario'}"\nMandado el: ${new Date(messageData.message.createdTimestamp).toLocaleString()}`);
        try {
            await owner.send({ embeds: [reactionEmbed] });
            console.log(`Notificación enviada a ${OWNER_ID}: Belén reaccionó con ${reaction.emoji}`);
        } catch (error) {
            console.error('Error al notificar al dueño:', error);
        }
    }
});

client.on('raw', (d) => {
    console.log('Evento raw recibido:', d.t);
    manager.updateVoiceState(d);
});

client.login(process.env.DISCORD_TOKEN);
