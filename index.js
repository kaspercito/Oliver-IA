const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Manager } = require('erela.js');
const Spotify = require('erela.js-spotify');
const lyricsFinder = require('lyrics-finder');
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
    '¡Detección de mayúsculas añadida! Si usas muchas mayúsculas (80% o más), el mensaje se borra y te mutea 5 minutos si hay permisos.',
    '¡Notificación de mayúsculas en el canal! Ahora avisa si alguien fue muteado o no por gritar, con estilo costeño.',
    '¡Chat mejorado! Segunda respuesta automática al darle ❌, pa’ que sea más bacán y no pida detalles de una.',
];

// Estado anterior de las actualizaciones (del código pasado)
const PREVIOUS_BOT_UPDATES = [
    '¡Detección de mayúsculas añadida! Si usas muchas mayúsculas (80% o más), el mensaje se borra y te mutea 5 minutos si hay permisos.',
    '¡Notificación de mayúsculas en el canal! Ahora avisa si alguien fue muteado o no por gritar, con estilo costeño.',
    '¡Chat mejorado! Segunda respuesta automática al darle ❌, pa’ que sea más bacán y no pida detalles de una.',
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
let activeTrivia = new Map();
let sentMessages = new Map();
let processedMessages = new Map();
// Estado inicial
let dataStore = { 
    conversationHistory: {}, 
    triviaRanking: {}, 
    personalPPMRecords: {}, 
    reactionStats: {}, 
    reactionWins: {}, 
    activeSessions: {}, 
    triviaStats: {},
    musicSessions: {}, // Asegurado desde el inicio
};
let dataStoreModified = false;
let autosaveEnabled = true; // Control manual del autosave
let autosavePausedByMusic = false; // Control automático por música

// Utilidades
const createEmbed = (color, title, description, footer = 'Con cariño, Miguel IA') => {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description || ' ')
        .setFooter({ text: footer })
        .setTimestamp();
};

const sendError = async (channel, message, suggestion = '¿Intentamos de nuevo?', footer = 'Con cariño, Miguel IA') => {
    const embed = createEmbed('#FF5555', '¡Ups!', `${message}\n${suggestion}`, footer);
    return await channel.send({ embeds: [embed] });
};

const sendSuccess = async (channel, title, message, footer = 'Con cariño, Miguel IA') => {
    const embed = createEmbed('#55FF55', title, message, footer);
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
            await channel.send({ embeds: [createEmbed('#FFAA00', '🎵 Autosave pausado', 
                'El guardado automático se pausó porque estás escuchando música.')] });
        }
        return;
    }

    if (!musicActive && autosavePausedByMusic) {
        autosavePausedByMusic = false;
        autosaveEnabled = true; // Reanudar autosave si estaba pausado solo por música
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            await channel.send({ embeds: [createEmbed('#55FF55', '💾 Autosave reanudado', 
                'La música terminó, el guardado automático se reanudó.')] });
        }
    }

    if (!dataStoreModified || !autosaveEnabled || autosavePausedByMusic) return;

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
        await channel.send({ embeds: [createEmbed('#FFAA00', '⏰ Aviso de Guardado', 
            '¡Atención! El autoguardado será en 5 minutos.')] });
    }
    setTimeout(async () => {
        if (!autosaveEnabled || autosavePausedByMusic) return; // No guardar si está pausado
        await saveDataStore();
        if (channel) {
            await channel.send({ embeds: [createEmbed('#55FF55', '💾 Guardado Completado', 
                'Datos guardados exitosamente.')] });
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
    console.log(`Instancia ${instanceId} - Iniciando trivia para ${message.author.id}`);
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    console.log("Mensaje recibido:", message.content);

    // Verificar permisos del bot en el canal
    const channelPermissions = message.channel.permissionsFor(message.guild.members.me);
    if (!channelPermissions.has('SEND_MESSAGES')) {
        console.log("No tengo permiso para enviar mensajes en el canal:", message.channel.id);
        return;
    }
    if (!channelPermissions.has('EMBED_LINKS')) {
        console.log("No tengo permiso para incrustar enlaces en el canal:", message.channel.id);
        return;
    }
    console.log("Permisos verificados: SEND_MESSAGES y EMBED_LINKS OK");

    // Procesar argumentos con normalización de tildes
    const args = message.content.split(' ').slice(1).map(arg => normalizeText(arg));
    console.log("Argumentos procesados:", args);

    let categoria = args[0] || 'capitales';
    let numQuestions = 20;
    if (args[1] && !isNaN(args[1])) {
        numQuestions = Math.max(parseInt(args[1]), 20); // Acepta cualquier número, mínimo 20
    } else if (args[0] && !isNaN(args[0])) {
        numQuestions = Math.max(parseInt(args[0]), 20);
        categoria = 'capitales';
    }
    console.log("Categoría seleccionada:", categoria, "Número de preguntas:", numQuestions);

    try {
        // Validar categoría
        if (!preguntasTriviaSinOpciones[categoria]) {
            console.log("Categoría no encontrada:", categoria);
            const errorEmbed = createEmbed('#FF5555', '¡Ups!', 
                `Categoría "${categoria}" no encontrada. Categorías disponibles: ${Object.keys(preguntasTriviaSinOpciones).join(', ')}`);
            console.log("Intentando enviar mensaje de error...");
            await message.channel.send({ embeds: [errorEmbed] });
            console.log("Mensaje de error enviado");
            return;
        }
        console.log("Categoría válida, iniciando trivia...");

        let channelProgress = dataStore.activeSessions[message.channel.id] || { 
            type: 'trivia', 
            currentQuestion: 0, 
            score: 0, 
            totalQuestions: numQuestions, 
            usedQuestions: [], 
            categoria: categoria 
        };
        const usedQuestions = channelProgress.usedQuestions || [];
        console.log("Progreso del canal:", channelProgress);

        while (channelProgress.currentQuestion < numQuestions) {
            const trivia = obtenerPreguntaTriviaSinOpciones(usedQuestions, categoria);
            console.log("Pregunta seleccionada:", trivia);
            if (!trivia) {
                console.log("No hay más preguntas disponibles en", categoria);
                await message.channel.send({ embeds: [createEmbed('#FF5555', '¡Ups!', 
                    'No hay más preguntas disponibles en esta categoría.')] });
                break;
            }
            usedQuestions.push(trivia.pregunta);
            const embedPregunta = createEmbed('#55FFFF', `🎲 ¡Pregunta ${channelProgress.currentQuestion + 1} de ${numQuestions}! (${categoria})`,
                `${trivia.pregunta}\n\nEscribe tu respuesta (60 segundos), ${userName}.`);
            console.log("Intentando enviar pregunta...");
            const sentMessage = await message.channel.send({ embeds: [embedPregunta] });
            console.log("Pregunta enviada, ID:", sentMessage.id);
            activeTrivia.set(message.channel.id, { id: sentMessage.id, correcta: trivia.respuesta, timestamp: Date.now(), userId: message.author.id });

            channelProgress.usedQuestions = usedQuestions;
            dataStore.activeSessions[message.channel.id] = channelProgress;
            dataStoreModified = true;

            try {
                const respuestas = await message.channel.awaitMessages({
                    filter: (res) => res.author.id === message.author.id && res.content.trim().length > 0,
                    max: 1,
                    time: 60000,
                    errors: ['time']
                });
                const respuestaUsuario = respuestas.first().content;
                const cleanedUserResponse = cleanText(respuestaUsuario);
                const cleanedCorrectResponse = cleanText(trivia.respuesta);
                activeTrivia.delete(message.channel.id);

                if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
                if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
                dataStore.triviaStats[message.author.id][categoria].total += 1;
                dataStoreModified = true;

                if (cleanedUserResponse === cleanedCorrectResponse) {
                    channelProgress.score += 1;
                    dataStore.triviaStats[message.author.id][categoria].correct += 1;
                    await message.channel.send({ embeds: [createEmbed('#55FF55', '🎉 ¡Correcto!',
                        `¡Bien hecho, ${userName}! La respuesta correcta era **${trivia.respuesta}**. ¡Ganaste 1 punto! (Total: ${channelProgress.score})`)] });
                } else {
                    await message.channel.send({ embeds: [createEmbed('#FF5555', '❌ ¡Casi!',
                        `Lo siento, ${userName}, la respuesta correcta era **${trivia.respuesta}**. Tu respuesta fue "${respuestaUsuario}".`)] });
                }
                channelProgress.currentQuestion += 1;
                dataStore.activeSessions[message.channel.id] = channelProgress;
                dataStoreModified = true;
            } catch (error) {
                activeTrivia.delete(message.channel.id);
                if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
                if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
                dataStore.triviaStats[message.author.id][categoria].total += 1;
                dataStoreModified = true;
                await message.channel.send({ embeds: [createEmbed('#FF5555', '⏳ ¡Tiempo agotado!',
                    `Se acabó el tiempo, ${userName}. La respuesta correcta era **${trivia.respuesta}**.`)] });
                channelProgress.currentQuestion += 1;
                dataStore.activeSessions[message.channel.id] = channelProgress;
                dataStoreModified = true;
            }
        }

        if (channelProgress.currentQuestion >= numQuestions) {
            await message.channel.send({ embeds: [createEmbed('#55FF55', '🏁 ¡Trivia Terminada!',
                `¡Completaste las ${numQuestions} preguntas de ${categoria}, ${userName}! Puntuación final: ${channelProgress.score}. Usa !rk para ver tu ranking.`)] });
            if (!dataStore.triviaRanking[message.author.id]) dataStore.triviaRanking[message.author.id] = {};
            if (!dataStore.triviaRanking[message.author.id][categoria]) dataStore.triviaRanking[message.author.id][categoria] = { score: 0 };
            dataStore.triviaRanking[message.author.id][categoria].score = (dataStore.triviaRanking[message.author.id][categoria].score || 0) + channelProgress.score;
            delete dataStore.activeSessions[message.channel.id];
            dataStoreModified = true;
        }
    } catch (error) {
        console.error("Error en manejarTrivia:", error.message);
        try {
            await message.channel.send({ embeds: [createEmbed('#FF5555', '¡Error!', 
                `Algo salió mal: ${error.message}. ¿Tengo permisos para enviar mensajes aquí?`)] });
        } catch (sendError) {
            console.error("No se pudo enviar mensaje de error:", sendError.message);
        }
    }
}

async function manejarAutosave(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (autosavePausedByMusic && autosaveEnabled) {
        return sendError(message.channel, `El autosave está pausado por música activa, ${userName}.`, 
            'Espera a que termine la música o usa !st para detenerla.');
    }

    autosaveEnabled = !autosaveEnabled;

    if (autosaveEnabled) {
        await sendSuccess(message.channel, '💾 ¡Autosave reanudado!', 
            `El guardado automático está ahora activo, ${userName}. Se guardará cada 30 minutos.`);
    } else {
        await sendSuccess(message.channel, '⏸️ ¡Autosave pausado!', 
            `El guardado automático está pausado, ${userName}. Usa !as para reanudarlo o !save para guardar manualmente.`);
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
        `Escribe esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTienes 15 segundos, ${userName}.`);
    await message.channel.send({ embeds: [embed] });

    session.startTime = startTime;
    session.frase = frase;
    session.completed = false;
    dataStore.activeSessions[message.author.id] = session;
    dataStoreModified = true; // Indicar que dataStore ha sido modificado

    try {
        const respuestas = await message.channel.awaitMessages({
            filter: (res) => res.author.id === message.author.id && res.content.trim().length > 0,
            max: 1,
            time: 15000,
            errors: ['time']
        });
        const respuestaUsuario = respuestas.first().content;
        const endTime = Date.now();
        session.completed = true;
        delete dataStore.activeSessions[message.author.id];
        dataStoreModified = true; // Indicar que dataStore ha sido modificado

        const tiempoSegundos = (endTime - startTime) / 1000;
        const palabras = frase.split(' ').length;
        const ppm = Math.round((palabras / tiempoSegundos) * 60);

        if (cleanText(respuestaUsuario) === cleanText(frase)) {
            if (!dataStore.personalPPMRecords[message.author.id]) {
                dataStore.personalPPMRecords[message.author.id] = { best: { ppm: 0, timestamp: null }, attempts: [] };
            }

            dataStore.personalPPMRecords[message.author.id].attempts.push({ ppm, timestamp: new Date().toISOString() });
            dataStoreModified = true; // Indicar que dataStore ha sido modificado

            const currentBest = dataStore.personalPPMRecords[message.author.id].best.ppm || 0;
            if (ppm > currentBest) {
                dataStore.personalPPMRecords[message.author.id].best = { ppm, timestamp: new Date().toISOString() };
                dataStoreModified = true; // Indicar que dataStore ha sido modificado
                await sendSuccess(message.channel, '🎉 ¡Nuevo Récord!',
                    `¡Increíble, ${userName}! Escribiste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu nuevo récord: **${ppm} PPM**. ¡Mira tus intentos con !rppm!`);
            } else {
                await sendSuccess(message.channel, '🎉 ¡Perfecto!',
                    `¡Bien hecho, ${userName}! Escribiste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu PPM: **${ppm}**. Tu récord sigue siendo **${currentBest} PPM**. Mira todos tus intentos con !rppm.`);
            }
        } else {
            await sendError(message.channel, '❌ ¡Casi!',
                `Lo siento, ${userName}, no escribiste la frase correctamente. Tu respuesta fue "${respuestaUsuario}". ¡Intenta de nuevo con !pp!`);
        }
    } catch (error) {
        session.completed = true;
        delete dataStore.activeSessions[message.author.id];
        dataStoreModified = true; // Indicar que dataStore ha sido modificado
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
    dataStoreModified = true; // Indicar que dataStore ha sido modificado

    try {
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
        dataStoreModified = true; // Indicar que dataStore ha sido modificado

        if (!dataStore.reactionWins[ganador.id]) dataStore.reactionWins[ganador.id] = { username: ganador.username, wins: 0 };
        dataStore.reactionWins[ganador.id].wins += 1;
        dataStoreModified = true; // Indicar que dataStore ha sido modificado

        await sendSuccess(message.channel, '🎉 ¡Ganador!',
            `¡Felicidades, ${ganadorName}! Fuiste el primero en escribir **${palabra}** en ${tiempoSegundos.toFixed(2)} segundos. ¡Eres rapidísimo! Mira tu progreso con !rk.`);
    } catch (error) {
        session.completed = true;
        delete dataStore.activeSessions[message.channel.id];
        dataStoreModified = true; // Indicar que dataStore ha sido modificado
        await sendError(message.channel, '⏳ ¡Tiempo agotado!',
            `Nadie escribió **${palabra}** a tiempo. ¡Mejor suerte la próxima vez con !re!`);
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
async function manejarChat(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const chatMessage = message.content.startsWith('!chat') ? message.content.slice(5).trim() : message.content.slice(3).trim();
    
    // Validar que haya un mensaje
    if (!chatMessage) {
        return sendError(message.channel, `Escribe algo después de "!ch", ${userName}. ¡No me dejes con las ganas, pana!`, undefined, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
    }

    // Mostrar mensaje de espera
    const waitingEmbed = createEmbed('#55FFFF', `¡Un momento, ${userName}!`, 'Pensando una respuesta bien bacán pa’ ti...', 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        // Prompt optimizado para conversación natural
        const prompt = `Eres Miguel IA, creado por Miguel, un man bien chévere de la costa ecuatoriana. Responde a "${chatMessage}" como si fueras mi compa, con onda natural, detallada y relajada. Usa palabras costeñas como "chévere", "jaja", "man", "vaina", "cacha", "pana", "webada" o "qué bacán". Sé conversacional, útil y preciso, sin inventar locuras ni desviarte del tema. Si es un cálculo, resuélvelo clarito; si no sabes algo (como datos en tiempo real), da una respuesta aproximada o pide más contexto con humor. Termina siempre con "¿Te cacha esa respuesta, ${userName}? ¿Seguimos charlando o qué, pana?" pa’ mantener la conversa viva.`;

        // Consulta a la API de Hugging Face
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
            {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500, // Más espacio para respuestas largas
                    return_full_text: false, // Solo la respuesta generada
                    temperature: 0.7 // Balance entre creatividad y coherencia
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 90000 // 90 segundos de timeout
            }
        );

        // Obtener la respuesta
        let aiReply = response.data[0]?.generated_text?.trim();

        // Si la API no devuelve nada útil, damos una respuesta genérica conversacional
        if (!aiReply || aiReply.length < 5) {
            aiReply = `¡Qué vaina, ${userName}! No sé qué pasó ahí, pero igual estoy aquí pa’ ti. ¿Qué tal si me tiras otra pregunta pa’ cachar mejor, pana?`;
        }

        // Asegurar la frase de cierre si no viene en la respuesta
        if (!aiReply.includes('¿Te cacha esa respuesta')) {
            aiReply += `\n\n¿Te cacha esa respuesta, ${userName}? ¿Seguimos charlando o qué, pana?`;
        }

        // Enviar la respuesta
        const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, aiReply, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
        const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
        await updatedMessage.react('✅');
        await updatedMessage.react('❌');
        sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });

    } catch (error) {
        console.error('Error en !chat con API:', error.message);
        const errorMessage = `¡Uy, ${userName}, qué webada! Algo se chispoteó y no pude responder bien. ${error.code === 'ECONNABORTED' ? 'Se cortó la conexión, man, tardó demasiado.' : `Error: ${error.message}.`} ¿Me tiras otra vez tu mensaje pa’ intentarlo de nuevo, pana?`;
        const errorEmbed = createEmbed('#FF5555', '¡Qué webada!', `${errorMessage}\n\n¿Te cacha esa respuesta, ${userName}? ¿Seguimos charlando o qué, pana?`, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
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
        `${userName} propone: "${suggestion}"`);

    try {
        await owner.send({ embeds: [ownerEmbed] });
        await sendSuccess(message.channel, '¡Sugerencia enviada!',
            `Tu idea ya está con Miguel, ${userName}. ¡Gracias por ayudarme a mejorar!`);
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
    const ownerEmbed = createEmbed('#FFD700', '¡Solicitud de ayuda!',
        `${userName} necesita ayuda con: "${issue}"`);

    try {
        await owner.send({ embeds: [ownerEmbed] });
        await sendSuccess(message.channel, '¡Ayuda en camino!',
            `Ya le avisé a Miguel, ${userName}. ¡Pronto te ayudará!`);
    } catch (error) {
        console.error('Error al enviar ayuda:', error);
        await sendError(message.channel, 'No pude avisar a Miguel', `Ocurrió un error, ${userName}. ¿Intentamos de nuevo?`);
    }
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
        const myScore = dataStore.triviaRanking[OWNER_ID]?.[categoria]?.score || 0;
        const luzScore = dataStore.triviaRanking[ALLOWED_USER_ID]?.[categoria]?.score || 0;
        const myStats = dataStore.triviaStats[OWNER_ID]?.[categoria] || { correct: 0, total: 0 };
        const luzStats = dataStore.triviaStats[ALLOWED_USER_ID]?.[categoria] || { correct: 0, total: 0 };
        const myPercentage = myStats.total > 0 ? Math.round((myStats.correct / myStats.total) * 100) : 0;
        const luzPercentage = luzStats.total > 0 ? Math.round((luzStats.correct / luzStats.total) * 100) : 0;

        triviaList += `\n**${categoria.charAt(0).toUpperCase() + categoria.slice(1)}** 🎲\n` +
                      `> 👑 Miguel: **${myScore} puntos** (${myPercentage}% acertadas)\n` +
                      `> 🌟 Belén: **${luzScore} puntos** (${luzPercentage}% acertadas)\n`;
    });

    const ppmRecord = dataStore.personalPPMRecords[userId]?.best || { ppm: 0, timestamp: null };
    let ppmList = ppmRecord.ppm > 0 
        ? `> Tu récord: **${ppmRecord.ppm} PPM** - ${new Date(ppmRecord.timestamp).toLocaleString()}`
        : '> No tienes un récord de PPM aún. ¡Prueba con !pp!';

    const myReactionWins = dataStore.reactionWins[OWNER_ID]?.wins || 0;
    const luzReactionWins = dataStore.reactionWins[ALLOWED_USER_ID]?.wins || 0;
    const reactionList = `> 👑 Miguel - **${myReactionWins} Reacciones**\n` +
                         `> 🌟 Belén - **${luzReactionWins} Reacciones**`;

    return new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 Ranking de ${username}`)
        .setDescription('¡Aquí están tus logros y los de tus rivales!')
        .addFields(
            { name: '📊 Trivia', value: triviaList, inline: false },
            { name: '⌨️ PPM (Récord Más Rápido)', value: ppmList, inline: false },
            { name: '⚡ Victorias en Reacciones', value: reactionList, inline: false }
        )
        .setFooter({ text: 'Con cariño, Miguel IA' })
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
        .setFooter({ text: 'Con cariño, Miguel IA' })
        .setTimestamp();

    await message.channel.send({ embeds: [embed] });
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
    console.log(`Comando recibido: ${content}`);

    if (content.startsWith('!trivia') || content.startsWith('!tr')) {
        await manejarTrivia(message);
    } else if (content.startsWith('!chat') || content.startsWith('!ch')) {
        await manejarChat(message);
    } else if (content === '!ppm' || content === '!pp') {
        await manejarPPM(message);
    } else if (content === '!reacciones' || content === '!re') {
        await manejarReacciones(message);
    } else if (content === '!luz') {
        const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
        const mensaje = mensajesAnimo[Math.floor(Math.random() * mensajesAnimo.length)];
        const embed = createEmbed('#FFAA00', `¡Ánimo, ${userName}!`, mensaje);
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!save') {
        const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
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
    } else if (content.startsWith('!sugerencias') || content.startsWith('!su')) {
        await manejarSugerencias(message);
    } else if (content.startsWith('!ayuda') || content.startsWith('!ay')) {
        await manejarAyuda(message);
    } else if (content === '!rankingppm' || content === '!rppm') {
        await manejarRankingPPM(message);
    } else if (content.startsWith('!play') || content.startsWith('!pl')) {
        await manejarPlay(message);
    } else if (content === '!pause' || content === '!pa') {
        await manejarPause(message);
    } else if (content === '!skip' || content === '!sk') {
        await manejarSkip(message);
    } else if (content === '!stop' || content === '!st') {
        await manejarStop(message);
    } else if (content === '!queue' || content === '!qu') {
        await manejarQueue(message);
    } else if (content === '!repeat' || content === '!rp') {
        await manejarRepeat(message);
    } else if (content === '!back' || content === '!bk') {
        await manejarBack(message);
    } else if (content === '!autoplay' || content === '!ap') {
        await manejarAutoplay(message);
    } else if (content === '!autosave' || content === '!as') {
        await manejarAutosave(message);
    } else if (content === '!lyrics' || content === '!ly') {
        await manejarLyrics(message);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (![OWNER_ID, ALLOWED_USER_ID].includes(message.author.id)) return;

    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const content = message.content.toLowerCase(); // Declaramos 'content' solo aquí

    // Detectar uso excesivo de mayúsculas
    const lettersOnly = message.content.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (lettersOnly.length > 5) {
        const uppercaseCount = lettersOnly.split('').filter(char => char === char.toUpperCase()).length;
        const uppercasePercentage = (uppercaseCount / lettersOnly.length) * 100;
        if (uppercasePercentage >= 80) {
            try {
                // Borrar el mensaje con mayúsculas
                await message.delete();

                // Intentar mutear al usuario
                const member = message.guild.members.cache.get(message.author.id);
                if (member && message.guild.members.me.permissions.has('MODERATE_MEMBERS')) {
                    await member.timeout(5 * 60 * 1000, 'Uso excesivo de mayúsculas');
                    await message.channel.send({ 
                        embeds: [createEmbed('#FF5555', '⛔ ¡Calma, pana!', 
                            `¡${userName} usó muchas mayúsculas y fue muteado por 5 minutos! Nada de gritar por aquí, ¿sí?`)] 
                    });
                } else {
                    await message.channel.send({ 
                        embeds: [createEmbed('#FF5555', '⛔ ¡Ups, no pude mutear!', 
                            `¡${userName} usó muchas mayúsculas, pero no tengo permisos pa’ mutearlo! Igual el mensaje se fue, jaja.`)] 
                    });
                }
            } catch (error) {
                console.error('Error al mutear:', error.message);
                await message.channel.send({ 
                    embeds: [createEmbed('#FF5555', '⛔ ¡Qué webada!', 
                        `¡${userName} usó muchas mayúsculas, pero fallé al mutearlo! Error: ${error.message}. El mensaje ya se borró, tranqui.`)] 
                });
            }
            return; // Salimos pa’ no procesar más el mensaje
        }
    }

    if (processedMessages.has(message.id)) return;
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

    // Pasamos 'content' a las funciones que lo necesiten
    await manejarCommand(message, content);

    // Comandos ranking
    if (content === '!ranking' || content === '!rk') {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!help' || content === '!h') {
        const embed = createEmbed('#55FF55', `¡Comandos para ti, ${userName}!`,
            '¡Aquí tienes lo que puedo hacer!\n' +
            '- **!ch / !chat [mensaje]**: Charla conmigo.\n' +
            '- **!tr / !trivia [categoría] [n]**: Trivia por categoría (mínimo 20). Categorías: ' + Object.keys(preguntasTriviaSinOpciones).join(', ') + '\n' +
            '- **!pp / !ppm**: Prueba de mecanografía.\n' +
            '- **!rk / !ranking**: Ver puntajes y estadísticas (récord más alto de PPM).\n' +
            '- **!rppm / !rankingppm**: Ver todos tus intentos de PPM.\n' +
            '- **!re / !reacciones**: Juego de escribir rápido.\n' +
            '- **!su / !sugerencias [idea]**: Envía ideas para mejorar el bot.\n' +
            '- **!ay / !ayuda [problema]**: Pide ayuda a Miguel.\n' +
            '- **!save**: Guardar datos ahora.\n' +
            '- **!as / !autosave**: Pausa o reanuda el guardado automático.\n' +
            '- **!h / !help**: Lista de comandos generales.\n' +
            '- **!hm / !help musica**: Lista de comandos de música.\n' +
            '- **hola**: Saludo especial.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!help musica' || content === '!hm') {
        const embed = createEmbed('#55FF55', `¡Comandos de música para ti, ${userName}!`,
            '¡Controla la música con estos comandos!\n' +
            '- **!pl / !play [canción/URL]**: Reproduce música.\n' +
            '- **!pa / !pause**: Pausa o reanuda la música.\n' +
            '- **!sk / !skip**: Salta a la siguiente canción.\n' +
            '- **!st / !stop**: Detiene la música.\n' +
            '- **!qu / !queue**: Muestra la cola de reproducción.\n' +
            '- **!rp / !repeat [cola]**: Repite la canción actual o la cola.\n' +
            '- **!bk / !back**: Vuelve a la canción anterior.\n' +
            '- **!ap / !autoplay**: Activa/desactiva el autoplay.\n' +
            '- **!ly / !lyrics [canción]**: Muestra las letras de la canción actual o una específica.\n' + // Añadir esta línea
            '- **!hm / !help music**: Lista de comandos de música.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === 'hola') {
        const embed = createEmbed('#55FFFF', `¡Ey, qué bacán verte, ${userName}!`,
            `¡Hola, pana! Soy Miguel IA, tu compa costeño, trayéndote todo el calor de la playa y el sabor de un buen encebollado. ¿Cómo estás hoy, man? Estoy listo pa’ charlar contigo, resolver tus dudas o tirar unas risas bien chéveres. ¿Qué se te ocurre, pana? ¡Dale, que la vida es pa’ disfrutarla!`);
    }
});

// Eventos
client.once('ready', async () => {
    console.log(`¡Miguel IA está listo! Instancia: ${instanceId}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudar a Miguel y Milagros", type: 0 }], status: 'online' });
    dataStore = await loadDataStore();
    activeTrivia = new Map(Object.entries(dataStore.activeSessions).filter(([_, s]) => s.type === 'trivia'));
    manager.init(client.user.id);
    if (!dataStore.musicSessions) {
        dataStore.musicSessions = {};
        console.log('musicSessions no estaba presente, inicializado manualmente');
    }
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) throw new Error('Canal no encontrado');

        const userHistory = dataStore.conversationHistory[ALLOWED_USER_ID] || [];
        const historySummary = userHistory.length > 0
            ? userHistory.slice(-3).map(msg => `${msg.role === 'user' ? 'Belén' : 'Yo'}: ${msg.content}`).join('\n')
            : 'No hay historial reciente.';
        const argentinaTime = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

        const updatesChanged = JSON.stringify(BOT_UPDATES) !== JSON.stringify(PREVIOUS_BOT_UPDATES);

        if (updatesChanged) {
            const updateEmbed = createEmbed('#FFD700', '📢 Actualizaciones de Miguel IA',
                '¡Tengo mejoras nuevas para compartir contigo!')
                .addFields(
                    { name: 'Novedades', value: BOT_UPDATES.map(update => `- ${update}`).join('\n'), inline: false },
                    { name: 'Hora de actualización', value: `${argentinaTime}`, inline: false },
                );
            await channel.send({ content: `<@${ALLOWED_USER_ID}>`, embeds: [updateEmbed] });
        }
    } catch (error) {
        console.error('Error al enviar actualizaciones:', error);
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

    if (reaction.emoji.name === '❌') {
        // Intentar una segunda respuesta automáticamente
        const originalQuestion = messageData.originalQuestion;
        const prompt = `Eres Miguel IA, creado por Miguel, un man bien chévere de la costa ecuatoriana. La primera respuesta a "${originalQuestion}" no le gustó al usuario. Intenta de nuevo con una respuesta más detallada, útil y bacán, usando palabras costeñas como "chévere", "jaja", "man", "vaina", "cacha", "pana", "webada" o "qué bacán". Si es pa’ Belén, trátala con cariño. Responde SOLO con base al mensaje, nada de inventar locuras. Sé súper claro y relajado. Termina con una vibe pa’ seguir la conversa.`;

        try {
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                {
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 500,
                        return_full_text: false,
                        temperature: 0.7
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 90000
                }
            );

            let aiReply = response.data[0]?.generated_text?.trim() || 
                `Uy, ${userName}, parece que la vaina se complicó otra vez. Dame un poco más de pista pa’ cacharte bien, ¿sí?`;
            aiReply += `\n\n¿Mejoró esta vez, ${userName}? ¿Qué tal si seguimos charlando, pana?`;

            const alternativeEmbed = createEmbed('#55FFFF', `¡Segunda ronda, ${userName}!`, aiReply, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
            const newMessage = await reaction.message.channel.send({ embeds: [alternativeEmbed] });
            await newMessage.react('✅');
            await newMessage.react('❌');
            sentMessages.set(newMessage.id, { content: aiReply, originalQuestion: originalQuestion, message: newMessage });
        } catch (error) {
            console.error('Error al generar segunda respuesta:', error.message);
            const errorEmbed = createEmbed('#FF5555', '¡Qué webada!', 
                `¡Uy, ${userName}, fallé otra vez! Error: ${error.message}. ¿Me das más detalles pa’ cacharlo bien esta vez?`, 
                'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
            const newMessage = await reaction.message.channel.send({ embeds: [errorEmbed] });
            await newMessage.react('✅');
            await newMessage.react('❌');
            sentMessages.set(newMessage.id, { content: errorEmbed.data.description, originalQuestion: originalQuestion, message: newMessage });
        }
    }

    // Notificación al owner si es Belén
    if (user.id === ALLOWED_USER_ID) {
        const owner = await client.users.fetch(OWNER_ID);
        const reactionEmbed = createEmbed('#FFD700', '¡Belén reaccionó!', 
            `Belén reaccionó con ${reaction.emoji} a: "${messageData.content}"\nPregunta original: "${messageData.originalQuestion}"\nEnviado el: ${new Date(messageData.message.createdTimestamp).toLocaleString()}`);
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
