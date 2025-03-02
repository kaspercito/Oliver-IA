const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const SpotifyWebApi = require('spotify-web-api-node');
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
        GatewayIntentBits.GuildVoiceStates, // Necesario para música
    ],
});

// IDs y constantes
const OWNER_ID = '752987736759205960'; // Tu ID
const ALLOWED_USER_ID = '1023132788632862761'; // ID de Belén
const CHANNEL_ID = '1343749554905940058'; // Canal principal

// Cola de reproducción
const queue = new Map();

// Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const BOT_UPDATES = [
    '¡Trivia extendida! Ahora las trivias son de 20 preguntas por defecto en lugar de 10.',
    '¡Guardado automático mejorado! Avisa 5 minutos antes cada 30 minutos para que evites iniciar nuevos comandos.',
    '¡Comandos !sugerencias y !ayuda añadidos! Envía ideas o pide ayuda directamente a Miguel.',
    '¡PPM más rápido! El tiempo para escribir la frase se redujo de 60 a 15 segundos.',
];

// Estado anterior de las actualizaciones (del código pasado)
const PREVIOUS_BOT_UPDATES = [
    '¡Trivia extendida! Ahora las trivias son de 20 preguntas por defecto en lugar de 10.',
    '¡Guardado automático mejorado! Avisa 5 minutos antes cada 30 minutos para que evites iniciar nuevos comandos.',
    '¡Comandos !sugerencias y !ayuda añadidos! Envía ideas o pide ayuda directamente a Miguel.',
    '¡PPM más rápido! El tiempo para escribir la frase se redujo de 60 a 15 segundos.',
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
    triviaRanking: {}, 
    personalPPMRecords: {}, 
    reactionStats: {}, 
    reactionWins: {}, 
    activeSessions: {}, 
    triviaStats: {},
};
let dataStoreModified = false; // Bandera para rastrear cambios en dataStore

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
            triviaStats: {},
            updatesSent: false
        };
        
        // Asegurarse de que personalPPMRecords tenga la nueva estructura
        if (!loadedData.personalPPMRecords) {
            loadedData.personalPPMRecords = {};
        }
        for (const userId in loadedData.personalPPMRecords) {
            if (!loadedData.personalPPMRecords[userId].best) {
                loadedData.personalPPMRecords[userId] = { best: { ppm: 0, timestamp: null }, attempts: [] };
            }
        }

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
            triviaStats: {},
            updatesSent: false
        };
    }
}

async function saveDataStore() {
    if (!dataStoreModified) {
        return false; // Indicar que no se guardó, sin log
    }

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
        return true; // Indicar que se guardó exitosamente
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
        throw error;
    }
}

// Aviso anticipado y guardado automático
const SAVE_INTERVAL = 1800000; // 30 minutos en milisegundos
const WARNING_TIME = 300000;   // 5 minutos antes (300,000 ms)

setInterval(async () => {
    if (!dataStoreModified) {
        return; // Silenciar el log cuando no hay cambios
    }

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
        await channel.send({ embeds: [createEmbed('#FFAA00', '⏰ Aviso de Guardado', '¡Atención! El autoguardado será en 5 minutos. Por favor, evita iniciar nuevos comandos durante el guardado para no interferir.')] });
    }

    setTimeout(async () => {
        await saveDataStore();
        if (channel) {
            await channel.send({ embeds: [createEmbed('#55FF55', '💾 Guardado Completado', 'Datos guardados exitosamente. ¡Puedes seguir usando el bot!')] });
        }
        dataStoreModified = false; // Reiniciar la bandera después de guardar
        console.log('Guardado automático completado y bandera reiniciada');
    }, WARNING_TIME);
}, SAVE_INTERVAL);
            
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
    let categoria = args[0] || 'capitales';
    let numQuestions = 20;
    if (args[1] && !isNaN(args[1]) && args[1] >= 20) numQuestions = parseInt(args[1]);
    else if (args[0] && !isNaN(args[0]) && args[0] >= 20) {
        numQuestions = parseInt(args[0]);
        categoria = 'capitales';
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
        dataStoreModified = true; // Indicar que dataStore ha sido modificado

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
            dataStoreModified = true; // Indicar que dataStore ha sido modificado

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
            dataStoreModified = true; // Indicar que dataStore ha sido modificado
        } catch (error) {
            activeTrivia.delete(message.channel.id);
            if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
            if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
            dataStore.triviaStats[message.author.id][categoria].total += 1;
            dataStoreModified = true; // Indicar que dataStore ha sido modificado
            await sendError(message.channel, '⏳ ¡Tiempo agotado!',
                `Se acabó el tiempo, ${userName}. La respuesta correcta era **${trivia.respuesta}**.`);
            channelProgress.currentQuestion += 1;
            dataStore.activeSessions[message.channel.id] = channelProgress;
            dataStoreModified = true; // Indicar que dataStore ha sido modificado
        }
    }

    if (channelProgress.currentQuestion >= numQuestions) {
        await sendSuccess(message.channel, '🏁 ¡Trivia Terminada!',
            `¡Completaste las ${numQuestions} preguntas de ${categoria}, ${userName}! Puntuación final: ${channelProgress.score}. Usa !rk para ver tu ranking.`);
        if (!dataStore.triviaRanking[message.author.id]) dataStore.triviaRanking[message.author.id] = {};
        if (!dataStore.triviaRanking[message.author.id][categoria]) dataStore.triviaRanking[message.author.id][categoria] = { score: 0 };
        dataStore.triviaRanking[message.author.id][categoria].score = (dataStore.triviaRanking[message.author.id][categoria].score || 0) + channelProgress.score;
        delete dataStore.activeSessions[message.channel.id];
        dataStoreModified = true; // Indicar que dataStore ha sido modificado
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

// Chat
async function manejarChat(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const chatMessage = message.content.startsWith('!chat') ? message.content.slice(5).trim() : message.content.slice(3).trim();
    if (!chatMessage) return sendError(message.channel, `Escribe un mensaje después de "!ch", ${userName}.`, undefined, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!');

    const waitingEmbed = createEmbed('#55FFFF', `¡Un momento, ${userName}!`, 'Espera, estoy buscando una respuesta...', 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!');
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
            const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, aiReply, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!').setImage(imageUrl);
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
        const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, aiReply, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!');
        const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
        await updatedMessage.react('✅');
        await updatedMessage.react('❌');
        sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });
    } catch (error) {
        console.error('Error en !chat:', error.message);
        const errorEmbed = createEmbed('#FF5555', '¡Ups!', `Algo salió mal, ${userName}. Error: ${error.message}. ¡Intenta de nuevo o reformula tu pregunta!`, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!');
        await waitingMessage.edit({ embeds: [errorEmbed] });
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

// Buscar en YouTube
async function searchYouTube(query) {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                key: process.env.YOUTUBE_API_KEY,
                maxResults: 1,
            },
        });
        const videoId = response.data.items[0]?.id.videoId;
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
    } catch (error) {
        console.error('Error buscando en YouTube:', error);
        return null;
    }
}

// Reproducir canción
async function playSong(guildId, channel) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue || !serverQueue.songs.length) {
        if (channel) {
            channel.send({ embeds: [createEmbed('#FF5555', '🎵 Cola vacía', 'No hay más canciones. ¡Añade una con !play!')] });
        }
        if (serverQueue && serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guildId);
        if (dataStore.musicQueue && dataStore.musicQueue[guildId]) {
            delete dataStore.musicQueue[guildId];
            dataStoreModified = true;
        }
        return;
    }

    try {
        const song = serverQueue.songs[0];
        const stream = ytdl(song.url, { 
            filter: 'audioonly', 
            quality: 'highestaudio', 
            highWaterMark: 1 << 25,
            requestOptions: { timeout: 30000 }
        });
        const resource = createAudioResource(stream);
        serverQueue.player.play(resource);

        // Enviar mensaje al canal de texto desde donde se invocó el comando
        if (channel) {
            channel.send({ embeds: [createEmbed('#55FF55', '🎵 Reproduciendo ahora', `**${song.title}**\nPedida por: ${song.requester}`)] });
        }
        dataStore.musicQueue = dataStore.musicQueue || {};
        dataStore.musicQueue[guildId] = {
            songs: serverQueue.songs,
            voiceChannelId: serverQueue.voiceChannelId,
        };
        dataStoreModified = true;
    } catch (error) {
        console.error('Error al reproducir canción:', error);
        if (channel) {
            sendError(channel, '🎵 Error al reproducir', `No pude reproducir "${serverQueue.songs[0].title}". Pasando a la siguiente...`);
        }
        serverQueue.songs.shift();
        playSong(guildId, channel);
    }
}

// Manejar comandos de música
async function handleMusicCommands(message) {
    const args = message.content.split(' ').slice(1);
    const command = message.content.split(' ')[0].toLowerCase();
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel && command !== '!queue') {
        return sendError(message.channel, '🎵 ¡Únete a un canal de voz!', 'Necesitas estar en un canal de voz para usar comandos de música.');
    }

    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const guildId = message.guild.id;

    if (command === '!play' || command === '!p') {
        if (!args.length) {
            return sendError(message.channel, '🎵 ¿Qué quieres escuchar?', 'Dame un enlace de YouTube o una playlist de Spotify.');
        }

        const url = args.join(' ');
        let songs = [];

        // Autenticar Spotify si no hay token
        if (!spotifyApi.getAccessToken()) {
            try {
                const data = await spotifyApi.clientCredentialsGrant();
                spotifyApi.setAccessToken(data.body['access_token']);
            } catch (error) {
                console.error('Error autenticando Spotify:', error);
                return sendError(message.channel, '🎵 Error con Spotify', 'No pude conectar con Spotify.');
            }
        }

        // Verificar si es una playlist de Spotify
        if (url.includes('spotify.com/playlist')) {
            const playlistId = url.split('playlist/')[1]?.split('?')[0];
            try {
                const playlist = await spotifyApi.getPlaylist(playlistId);
                const tracks = playlist.body.tracks.items;
                for (const item of tracks) {
                    const track = item.track;
                    const query = `${track.name} ${track.artists[0].name}`;
                    const youtubeUrl = await searchYouTube(query);
                    if (youtubeUrl) {
                        songs.push({
                            title: track.name,
                            url: youtubeUrl,
                            requester: userName,
                        });
                    }
                }
                sendSuccess(message.channel, '🎵 Playlist cargada', `Se añadieron ${songs.length} canciones de "${playlist.body.name}" a la cola.`);
            } catch (error) {
                console.error('Error al obtener playlist:', error);
                return sendError(message.channel, '🎵 Error con la playlist', 'No pude cargar esa playlist de Spotify.');
            }
        } else {
            let songInfo;
            try {
                songInfo = await ytdl.getInfo(url);
                songs.push({
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url,
                    requester: userName,
                });
            } catch (error) {
                return sendError(message.channel, '🎵 No encontré esa canción', 'Asegúrate de usar un enlace válido de YouTube.');
            }
        }

        const serverQueue = queue.get(guildId);
        if (!serverQueue) {
            const queueConstruct = {
                connection: joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guildId,
                    adapterCreator: message.guild.voiceAdapterCreator,
                }),
                player: createAudioPlayer(),
                songs: songs,
                voiceChannelId: voiceChannel.id,
            };
            queue.set(guildId, queueConstruct);

            queueConstruct.player.on(AudioPlayerStatus.Idle, () => {
                if (queueConstruct.songs.length > 0) {
                    queueConstruct.songs.shift();
                    playSong(guildId, message.channel);
                }
            });

            queueConstruct.player.on('error', error => {
                console.error('Error en el reproductor:', error);
                sendError(message.channel, '🎵 ¡Ups!', 'Error al reproducir, intentando la siguiente...');
                if (queueConstruct.songs.length > 0) {
                    queueConstruct.songs.shift();
                    playSong(guildId, message.channel);
                } else {
                    queue.delete(guildId);
                }
            });

            playSong(guildId, message.channel);
        } else {
            serverQueue.songs.push(...songs);
            if (songs.length === 1) {
                sendSuccess(message.channel, '🎵 Añadida a la cola', `**${songs[0].title}** se ha añadido, ${userName}.`);
            }
            dataStore.musicQueue = dataStore.musicQueue || {};
            dataStore.musicQueue[guildId] = {
                songs: serverQueue.songs,
                voiceChannelId: serverQueue.voiceChannelId,
            };
            dataStoreModified = true;
        }
    }

    if (command === '!skip' || command === '!s') {
        const serverQueue = queue.get(guildId);
        if (!serverQueue) return sendError(message.channel, '🎵 Nada que omitir', 'No hay música reproduciéndose.');
        serverQueue.player.stop();
        sendSuccess(message.channel, '🎵 Canción omitida', 'Pasamos a la siguiente.');
    }

    if (command === '!stop' || command === '!st') {
        const serverQueue = queue.get(guildId);
        if (!serverQueue) return sendError(message.channel, '🎵 Nada que detener', 'No hay música sonando.');
        serverQueue.songs = [];
        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queue.delete(guildId);
        delete dataStore.musicQueue[guildId];
        dataStoreModified = true;
        sendSuccess(message.channel, '🎵 Música detenida', 'Todo parado, ¿quieres empezar de nuevo?');
    }

    if (command === '!queue' || command === '!q') {
        const serverQueue = queue.get(guildId);
        if (!serverQueue || !serverQueue.songs.length) {
            return sendError(message.channel, '🎵 Cola vacía', 'No hay canciones en la cola.');
        }
        const songList = serverQueue.songs.map((song, index) => `${index + 1}. **${song.title}** - ${song.requester}`).join('\n');
        sendSuccess(message.channel, '🎵 Lista de reproducción', songList);
    }
}

// Restaurar cola de música tras reinicio
async function restoreMusicQueue() {
    if (!dataStore.musicQueue) return;
    for (const guildId in dataStore.musicQueue) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const savedQueue = dataStore.musicQueue[guildId];
        const voiceChannel = guild.channels.cache.get(savedQueue.voiceChannelId);
        if (!voiceChannel || !voiceChannel.joinable) {
            console.log(`No se puede unir al canal ${savedQueue.voiceChannelId} en guild ${guildId}`);
            delete dataStore.musicQueue[guildId];
            dataStoreModified = true;
            continue;
        }

        try {
            const queueConstruct = {
                connection: joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guildId,
                    adapterCreator: guild.voiceAdapterCreator,
                }),
                player: createAudioPlayer(),
                songs: savedQueue.songs,
                voiceChannelId: savedQueue.voiceChannelId,
            };
            queue.set(guildId, queueConstruct);

            queueConstruct.player.on(AudioPlayerStatus.Idle, () => {
                if (queueConstruct.songs.length > 0) {
                    queueConstruct.songs.shift();
                    playSong(guildId, voiceChannel.guild.channels.cache.find(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')));
                }
            });

            queueConstruct.player.on('error', error => {
                console.error('Error en el reproductor tras restauración:', error);
                if (queueConstruct.songs.length > 0) {
                    queueConstruct.songs.shift();
                    playSong(guildId, voiceChannel.guild.channels.cache.find(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')));
                } else {
                    queue.delete(guildId);
                }
            });

            // Enviar mensaje al primer canal de texto disponible donde el bot pueda escribir
            const textChannel = guild.channels.cache.find(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES'));
            if (textChannel) {
                playSong(guildId, textChannel);
            } else {
                playSong(guildId, null); // Reproduce sin enviar mensaje si no hay canal de texto
            }
        } catch (error) {
            console.error('Error restaurando cola:', error);
            delete dataStore.musicQueue[guildId];
            dataStoreModified = true;
        }
    }
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
    } else if (content.startsWith('!luz')) {
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
                dataStoreModified = false; // Reiniciar la bandera después de guardar manualmente
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
    } else if (content.startsWith('!rankingppm') || content.startsWith('!rppm')) {
        await manejarRankingPPM(message);
    }
    if (content.startsWith('!play') || content.startsWith('!p') || 
        content.startsWith('!skip') || content.startsWith('!s') || 
        content.startsWith('!stop') || content.startsWith('!st') || 
        content.startsWith('!queue') || content.startsWith('!q')) {
        await handleMusicCommands(message);
    } else {
        await manejarCommand(message);
    }

}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (![OWNER_ID, ALLOWED_USER_ID].includes(message.author.id)) return;

    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (processedMessages.has(message.id)) return;
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

    await manejarCommand(message);

    const content = message.content.toLowerCase();
    // Ajustar la lógica para evitar que !rankingppm y !rppm activen el ranking general
    if ((content === '!ranking' || content === '!rk') && !content.startsWith('!rankingppm')) {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
    } else if (content.startsWith('!help') || content.startsWith('!h')) {
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
            '- **!h / !help**: Lista de comandos.\n' +
            '- **hola**: Saludo especial.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === 'hola') {
        await sendSuccess(message.channel, `¡Hola, ${userName}!`, `Soy Miguel IA, aquí para ayudarte. Prueba !tr, !pp o !re.`);
    }
});

// Eventos
client.once('ready', async () => {
    console.log(`¡Miguel IA está listo! Instancia: ${instanceId}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudar a Miguel y Milagros", type: 0 }], status: 'online' });
    dataStore = await loadDataStore();
    activeTrivia = new Map(Object.entries(dataStore.activeSessions).filter(([_, s]) => s.type === 'trivia'));

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
        // Restaurar cola de música en cualquier canal de voz guardado
        await restoreMusicQueue();
    } catch (error) {
        console.error('Error al enviar actualizaciones o restaurar música:', error);
        // Intentar restaurar música incluso si falla el envío al canal de texto
        await restoreMusicQueue();
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
        const alternativeEmbed = createEmbed('#55FFFF', `¡Probemos otra vez, ${userName}!`,
            `No te gustó mi respuesta a "${messageData.originalQuestion}". Dame más detalles y lo intento de nuevo.`, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌, ¡por favor!');
        const newMessage = await reaction.message.channel.send({ embeds: [alternativeEmbed] });
        await newMessage.react('✅');
        await newMessage.react('❌');
        sentMessages.set(newMessage.id, { content: alternativeEmbed.data.description, originalQuestion: messageData.originalQuestion, message: newMessage });
    }

    if (user.id === ALLOWED_USER_ID) {
        const owner = await client.users.fetch(OWNER_ID);
        const reactionEmbed = createEmbed('#FFD700', '¡Belén reaccionó!',
            `Belén reaccionó con ${reaction.emoji} al mensaje: "${messageData.content}"\n\nEnviado el: ${new Date(messageData.timestamp).toLocaleString()}`);
        
        try {
            await owner.send({ embeds: [reactionEmbed] });
            console.log(`Notificación enviada a ${OWNER_ID}: Belén reaccionó con ${reaction.emoji}`);
        } catch (error) {
            console.error('Error al notificar al dueño:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
