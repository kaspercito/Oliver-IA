const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { Manager } = require('erela.js');
const { DiscordTogether } = require('discord-together');
const Spotify = require('erela.js-spotify');
const puppeteer = require('puppeteer');
const lyricsFinder = require('lyrics-finder');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const gTTS = require('gtts');
const FormData = require('form-data');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config();

// Creación del cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Permite acceder a información de servidores.
        GatewayIntentBits.GuildMessages, // Permite leer mensajes en servidores.
        GatewayIntentBits.GuildMessageReactions, // Permite leer reacciones a mensajes en servidores.
        GatewayIntentBits.DirectMessageReactions, // Permite leer reacciones en mensajes directos.
        GatewayIntentBits.MessageContent, // Permite leer el contenido de los mensajes.
        GatewayIntentBits.GuildVoiceStates, // Necesario para manejar estados de voz (para música).
    ]
});


// Crear instancias de otros componentes
const discordTogether = new DiscordTogether(client);
const OWNER_ID = '752987736759205960';
const ALLOWED_USER_ID = '1023132788632862761';
const CHANNEL_ID = '1343749554905940058';
const telegramToken = process.env.TELEGRAM_TOKEN; // Utiliza una variable de entorno
const botTelegram = new TelegramBot(telegramToken, { polling: false });
const chatIdBelen = '7894854634';

const agent = new https.Agent({ family: 4 }); // Forzar IPv4

// Configuración del Manager de erela.js
const manager = new Manager({
    nodes: [{
        identifier: 'MainNode',
        host: 'lava-v3.ajieblogs.eu.org',
        port: 443,
        password: 'https://dsc.gg/ajidevserver',
        retryAmount: 5,
        retryDelay: 1000,
        secure: true
    }],
    plugins: [
        new Spotify({
            clientID: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            axiosOptions: {
                httpsAgent: new https.Agent({ family: 4 }),
                timeout: 10000
              }
        }),
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

// Lista de actualizaciones del bot
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
    "¡Arreglado la opción de segunda respuestas cuando reaccionás con ❌! Más rápido y copado, loco.",
    '¡Nuevo !imagen / !im agregado! Generá imágenes zarpadas con Stable Diffusion, pedí lo que quieras (ej. !imagen un mate [cartoon]) y confirmá con ✅, loco.',
    '¡Historial de imágenes con !misimagenes / !mi! Mirá tus últimas 5 imágenes generadas con sus IDs, pa’ que no pierdas nada, che.',
    '¡Edición piola con !editarimagen / !ei! Modificá tus imágenes guardadas (ej. !editarimagen [ID] agregar un perro), solo las que hice yo, ¡posta!',
    '¡Solucionado el error con las imágenes, ahora sí funciona como la puta madre!',
    '¡Nuevo !ansiedad / !an agregado! Consejos rápidos pa’ calmar la ansiedad, con un mensaje zarpado de Miguel pa’ darte pilas, ¡genia!',
    '¡Nuevo !milagros revisa tus nombres en diferente idioma de buena onda pa’ hacerla sonreír, ¡re milagroso, che!',
    '¡Nuevo comando !avatar pa’ que Miguel y Belén me cambien la cara!',
    'Agregado embeds copados pa’ que todo se vea más lindo.',
    '¡Nuevo juego! Usá !jugar pa’ adivinar un número y sacarte el aburrimiento, loco.',
    '¡Memes al toque! Con !meme te traigo uno random pa’ reírte un rato.',
    '¡Charla loca! Usá !pregunta y te tiro una pregunta random pa’ que nos copemos charlando.',
    '¡Preguntas a full! La lista de !pregunta pasó de 30 a 150, pa’ que no te aburras nunca, posta.',
    '¡Memes con yapa! Ahora con !meme te traigo puros memes en español pa’ que le des rosca.',
    'Agregado !pr, Che.',
    '¡Música a full! Mejoramos las funciones de música: ahora podés tirar enlaces de playlists de YouTube y Spotify sin drama, y sumamos el comando !shuffle pa’ revolver la cola como loco.',
    '¡Le metimos pilas al bot, che! Ahora podés jugar Piedra, Papel o Tijera y romperla toda:',
    '- !ppt [piedra/papel/tijera]: Jugá contra mí, el bot más grosso del condado. Elegí tu jugada y vemos quién la pica, ¡dale!',
    '- !ppt @alguien: Desafiá a un amigo a un duelo épico. Reacciona con ✅ pa’ aceptar, mandá tu elección por MD y que gane el mejor, ¡posta!',
    '¡Nuevo !recordatorio / !rec agregado! Te hago acordar lo que sea cuando quieras. Ejemplo: "!rec \'comprar sanduche de miga\' en 1 hora" o "!rec \'llamar a Miguel\' mañana 14:30", ¡posta!',
    '¡Boss bar al 100%! Arreglamos la barra de progreso pa’ que llegue al final posta y se vea zarpada cuando termina el tema, ¡a romperla, che!',
    '¡Datos randoms en !dato! Ahora si no le das argumentos, te tira un dato curioso al azar con onda, ¡re copado pa’ sorprenderte, loco!',
    '¡Nuevo !chiste agregado! Usá !chiste y te tiro un chiste random pa’ que te rías a lo grande, ¡posta que la rompés, che!',
    '¡Nuevo !adivinanza / !ad agregado! Te tiro adivinanzas copadas pa’ que le des al coco, con 30 segundos pa’ responder, ¡dale, genia!',
    '¡Ranking con adivinanzas! Ahora en !rk se ven tus aciertos y porcentaje en adivinanzas, pa’ que veas quién la rompe más, ¡posta!',
    '¡Recordatorios a full! Ahora con !rec podés setear recordatorios diarios tipo !rec tomar mate todos los días 08:00, ¡posta que no me olvido, che!',
    '¡Lista de recordatorios con !misrecordatorios / !mr! Mirá tus recordatorios activos al toque, re útil pa’ no perderte nada, loco.',
    '¡Cancelación de recordatorios con !cancelarrecordatorio / !cr! Borra un recordatorio con su ID (lo ves en !mr), ¡al toque y sin drama!'
];

const opcionesPPT = ['piedra', 'papel', 'tijera'];

const adivinanzas = [
    {
        pregunta: "Soy redondo, soy de cuero, en la cancha soy el rey, los pibes me patean con ganas, ¿qué soy, che?",
        respuesta: "pelota"
    },
    {
        pregunta: "Estoy en el mate, estoy en el té, sin mí no hay gusto, ¿qué soy, qué sé?",
        respuesta: "azúcar"
    },
    {
        pregunta: "Soy blanco y negro, camino tranqui por el campo, no soy caballo ni vaca, pero igual me quieren mucho, ¿qué soy, loco?",
        respuesta: "pingüino"
    },
    {
        pregunta: "En la parrilla soy la estrella, me comen con chimichurri, soy jugosa y re sabrosa, ¿qué soy, posta?",
        respuesta: "asado"
    },
    {
        pregunta: "Me toman en la plaza, soy verde y amargo, con agua caliente me quieren, ¿qué soy, amigo?",
        respuesta: "mate"
    },
    {
        pregunta: "Soy un bicho que vuela, hago ruido en la noche, los pibes me cazan con linterna, ¿qué soy, che?",
        respuesta: "cucaracha"
    },
    {
        pregunta: "Estoy en el cielo, brillo de día, no soy estrella ni luna, pero caliento el asado, ¿qué soy, loco?",
        respuesta: "sol"
    },
    {
        pregunta: "Soy chiquito, soy de papel, me usás pa’ pagar el bondi, ¿qué soy, loco?",
        respuesta: "boleto"
    },
    {
        pregunta: "Me ponés en la cabeza, me querés cuando llueve, si me perdés te mojás, ¿qué soy, che?",
        respuesta: "paraguas"
    },
    {
        pregunta: "Soy blanco, soy frío, en el verano me chupás, ¿qué soy, amigo?",
        respuesta: "helado"
    },
    {
        pregunta: "Me subís y me bajás, te llevo a tu piso, en el edificio vivo, ¿qué soy, posta?",
        respuesta: "ascensor"
    },
    {
        pregunta: "Soy largo, soy verde, en el río me encontrás, no soy pez ni rana, ¿qué soy, loco?",
        respuesta: "yacaré"
    },
    {
        pregunta: "Me usás pa’ escribir, tengo tinta adentro, si me apretás mucho me rompo, ¿qué soy, che?",
        respuesta: "birome"
    },
    {
        pregunta: "Soy redonda, soy finita, me comés con la pizza, ¿qué soy, amigo?",
        respuesta: "aceituna"
    },
    {
        pregunta: "Me gritás en la cancha, me querés cuando ganás, soy alegría pura, ¿qué soy, posta?",
        respuesta: "gol"
    },
    {
        pregunta: "Soy chiquita, soy dulce, en la panadería me comprás, ¿qué soy, loco?",
        respuesta: "factura"
    },
    {
        pregunta: "Me ponés en los pies, me atás con cordones, si corro mucho me gastás, ¿qué soy, che?",
        respuesta: "zapatilla"
    },
    {
        pregunta: "Soy marrón, soy calentito, en el desayuno me tomás, ¿qué soy, amigo?",
        respuesta: "café"
    },
    {
        pregunta: "Me usás pa’ cortar, tengo filo zarpado, en la cocina soy el rey, ¿qué soy, posta?",
        respuesta: "cuchillo"
    },
    {
        pregunta: "Soy alto, soy verde, en el campo me ves, no soy árbol ni arbusto, ¿qué soy, loco?",
        respuesta: "maíz"
    },
    {
        pregunta: "Me escuchás en la radio, me bailás en la fiesta, soy puro ritmo, ¿qué soy, che?",
        respuesta: "música"
    },
    {
        pregunta: "Soy negro, soy brillante, me usás pa’ ver tele, si me perdés te enojás, ¿qué soy, amigo?",
        respuesta: "control"
    },
    {
        pregunta: "Me comés en el cine, soy salado y crujiente, si me tirás al piso te retan, ¿qué soy, posta?",
        respuesta: "pochoclo"
    },
    {
        pregunta: "Soy rápido, soy ruidoso, en la calle me encontrás, no soy auto ni moto, ¿qué soy, loco?",
        respuesta: "colectivo"
    },
    {
        pregunta: "Me usás pa’ dormir, soy blandita y cómoda, en la cama estoy, ¿qué soy, che?",
        respuesta: "almohada"
    },
    {
        pregunta: "Soy blanco, soy líquido, me echás en el arroz, si me falta no hay comida, ¿qué soy, amigo?",
        respuesta: "leche"
    },
    {
        pregunta: "Me colgás en la pared, te digo la hora, si me atraso te enojás, ¿qué soy, posta?",
        respuesta: "reloj"
    },
    {
        pregunta: "Soy dulce, soy pegajoso, me untás en el pan, ¿qué soy, loco?",
        respuesta: "dulce de leche"
    },
    {
        pregunta: "Me usás pa’ lavar, hago espuma zarpada, en el baño estoy, ¿qué soy, che?",
        respuesta: "jabón"
    },
    {
        pregunta: "Soy grande, soy de madera, te sentás con la familia, ¿qué soy, amigo?",
        respuesta: "mesa"
    },
    {
        pregunta: "Me ponés en la oreja, me hablás bajito, si me cortás no escuchás, ¿qué soy, posta?",
        respuesta: "teléfono"
    },
    {
        pregunta: "Soy chiquito, soy brillante, me das a tu novia, ¿qué soy, loco?",
        respuesta: "anillo"
    },
    {
        pregunta: "Me usás pa’ peinarte, tengo dientes pero no muerdo, ¿qué soy, che?",
        respuesta: "peine"
    },
    {
        pregunta: "Soy rojo, soy picante, me ponés en la empanada, ¿qué soy, amigo?",
        respuesta: "ají"
    },
    {
        pregunta: "Me subís pa’ viajar, tengo alas pero no soy pájaro, ¿qué soy, posta?",
        respuesta: "avión"
    },
    {
        pregunta: "Soy negro, soy caliente, me tomás en la oficina, ¿qué soy, loco?",
        respuesta: "té"
    },
    {
        pregunta: "Me usás pa’ leer, tengo hojas pero no soy árbol, ¿qué soy, che?",
        respuesta: "libro"
    },
    {
        pregunta: "Soy largo, soy finito, me fumás en el recreo, ¿qué soy, amigo?",
        respuesta: "cigarrillo"
    },
    {
        pregunta: "Me ponés en la espalda, llevo tus cosas al colegio, ¿qué soy, posta?",
        respuesta: "mochila"
    },
    {
        pregunta: "Soy blanco, soy suave, me usás pa’ limpiarte, ¿qué soy, loco?",
        respuesta: "papel"
    },
    {
        pregunta: "Me usás pa’ sentarte, tengo patas pero no camino, ¿qué soy, che?",
        respuesta: "silla"
    },
    {
        pregunta: "Soy dulce, soy redondo, me comés en el cumple, ¿qué soy, amigo?",
        respuesta: "caramelo"
    },
    {
        pregunta: "Me mirás pa’ verte, si me rompés son siete años de yeta, ¿qué soy, posta?",
        respuesta: "espejo"
    },
    {
        pregunta: "Soy grande, soy frío, guardo la comida pa’ después, ¿qué soy, loco?",
        respuesta: "heladera"
    },
    {
        pregunta: "Me usás pa’ prender fuego, soy chiquito pero peligroso, ¿qué soy, che?",
        respuesta: "fósforo"
    },
    {
        pregunta: "Soy amarillo, soy ácido, me exprimís pa’l jugo, ¿qué soy, amigo?",
        respuesta: "limón"
    },
    {
        pregunta: "Me ponés en el dedo, brillo en la oscuridad, ¿qué soy, posta?",
        respuesta: "pulsera"
    },
    {
        pregunta: "Soy verde, soy crocante, me comés en la ensalada, ¿qué soy, loco?",
        respuesta: "lechuga"
    },
    {
        pregunta: "Me usás pa’ abrir, giro en la cerradura, ¿qué soy, che?",
        respuesta: "llave"
    },
    {
        pregunta: "Soy marrón, soy duro, me encontrás en el bosque, ¿qué soy, amigo?",
        respuesta: "tronco"
    },
    {
        pregunta: "Me escuchás en la tormenta, retumbo bien fuerte, ¿qué soy, posta?",
        respuesta: "trueno"
    },
    {
        pregunta: "Soy blanco, soy esponjoso, me comés con la sopa, ¿qué soy, loco?",
        respuesta: "pan"
    },
    {
        pregunta: "Me usás pa’ coser, tengo un ojo pero no veo, ¿qué soy, che?",
        respuesta: "aguja"
    },
    {
        pregunta: "Soy largo, soy plateado, me usás pa’l guiso, ¿qué soy, amigo?",
        respuesta: "cuchara"
    },
    {
        pregunta: "Me ponés en la cara, me usás pa’ ver mejor, ¿qué soy, posta?",
        respuesta: "anteojos"
    },
    {
        pregunta: "Soy rojo, soy dulce, me comés en el postre, ¿qué soy, loco?",
        respuesta: "frutilla"
    },
    {
        pregunta: "Me usás pa’ barrer, tengo pelos pero no soy perro, ¿qué soy, che?",
        respuesta: "escoba"
    },
    {
        pregunta: "Soy negro, soy rápido, corro por la casa, ¿qué soy, amigo?",
        respuesta: "gato"
    },
    {
        pregunta: "Me ponés en la mesa, soy fino y transparente, ¿qué soy, posta?",
        respuesta: "vaso"
    },
    {
        pregunta: "Soy chiquita, soy roja, me comés con el fernet, ¿qué soy, loco?",
        respuesta: "cereza"
    },
    {
        pregunta: "Me usás pa’ nadar, estoy llena de agua, ¿qué soy, che?",
        respuesta: "pileta"
    },
    {
        pregunta: "Soy largo, soy amarillo, me comés en el verano, ¿qué soy, amigo?",
        respuesta: "choclo"
    },
    {
        pregunta: "Me subís pa’l balcón, tengo ruedas pero no soy auto, ¿qué soy, posta?",
        respuesta: "bicicleta"
    },
    {
        pregunta: "Soy blanco, soy cuadrado, me usás pa’l mate, ¿qué soy, loco?",
        respuesta: "azucarero"
    },
    {
        pregunta: "Me usás pa’ jugar, tengo cartas marcadas, ¿qué soy, che?",
        respuesta: "mazo"
    },
    {
        pregunta: "Soy verde, soy brillante, me encontrás en el césped, ¿qué soy, amigo?",
        respuesta: "grillo"
    },
    {
        pregunta: "Me ponés en el cuello, me usás pa’l frío, ¿qué soy, posta?",
        respuesta: "bufanda"
    },
    {
        pregunta: "Soy grande, soy ruidoso, me ves en la obra, ¿qué soy, loco?",
        respuesta: "camión"
    },
    {
        pregunta: "Me usás pa’ planchar, me enchufás y quemo, ¿qué soy, che?",
        respuesta: "plancha"
    },
    {
        pregunta: "Soy dulce, soy marrón, me derretís pa’l helado, ¿qué soy, amigo?",
        respuesta: "chocolate"
    },
    {
        pregunta: "Me ponés en la pared, tengo colores zarpados, ¿qué soy, posta?",
        respuesta: "cuadro"
    },
    {
        pregunta: "Soy chiquito, soy plateado, me usás pa’l cinturón, ¿qué soy, loco?",
        respuesta: "botón"
    },
    {
        pregunta: "Me usás pa’ volar, soy de papel y subo alto, ¿qué soy, che?",
        respuesta: "barrilete"
    },
    {
        pregunta: "Soy naranja, soy jugosa, me comés en el desayuno, ¿qué soy, amigo?",
        respuesta: "naranja"
    },
    {
        pregunta: "Me ponés en la mano, me usás pa’l sol, ¿qué soy, posta?",
        respuesta: "remera"
    },
    {
        pregunta: "Soy blanco, soy caliente, me tomás en la merienda, ¿qué soy, loco?",
        respuesta: "leche"
    },
    {
        pregunta: "Me usás pa’ mirar, tengo vidrio y agrando, ¿qué soy, che?",
        respuesta: "lupa"
    },
    {
        pregunta: "Soy largo, soy finito, me usás pa’l pelo, ¿qué soy, amigo?",
        respuesta: "lazo"
    },
    {
        pregunta: "Me ponés en el pie, soy duro y te protejo, ¿qué soy, posta?",
        respuesta: "zapato"
    },
    {
        pregunta: "Soy verde, soy grande, me ves en el río, ¿qué soy, loco?",
        respuesta: "lagarto"
    },
    {
        pregunta: "Me usás pa’ pintar, tengo pelos suaves, ¿qué soy, che?",
        respuesta: "pincel"
    },
    {
        pregunta: "Soy blanco, soy frío, caigo en el invierno, ¿qué soy, amigo?",
        respuesta: "nieve"
    },
    {
        pregunta: "Me ponés en la cabeza, me usás pa’l sol, ¿qué soy, posta?",
        respuesta: "gorra"
    },
    {
        pregunta: "Soy rojo, soy caliente, me usás pa’l locro, ¿qué soy, loco?",
        respuesta: "chorizo"
    },
    {
        pregunta: "Me usás pa’ guardar, soy de tela y cierro, ¿qué soy, che?",
        respuesta: "bolso"
    },
    {
        pregunta: "Soy amarillo, soy brillante, me ves en la noche, ¿qué soy, amigo?",
        respuesta: "estrella"
    },
    {
        pregunta: "Me ponés en la cara, me usás pa’l carnaval, ¿qué soy, posta?",
        respuesta: "máscara"
    },
    {
        pregunta: "Soy grande, soy verde, me subís pa’l campo, ¿qué soy, loco?",
        respuesta: "tractor"
    },
    {
        pregunta: "Me usás pa’ prender, soy eléctrico y zarpado, ¿qué soy, che?",
        respuesta: "encendedor"
    },
    {
        pregunta: "Soy dulce, soy finito, me chupás despacito, ¿qué soy, amigo?",
        respuesta: "chupetín"
    },
    {
        pregunta: "Me ponés en el brazo, me usás pa’l reloj, ¿qué soy, posta?",
        respuesta: "manga"
    },
    {
        pregunta: "Soy negro, soy suave, me encontrás en la calle, ¿qué soy, loco?",
        respuesta: "perro"
    },
    {
        pregunta: "Me usás pa’ medir, soy largo y flexible, ¿qué soy, che?",
        respuesta: "metro"
    },
    {
        pregunta: "Soy blanco, soy cuadrado, me usás pa’l dibujo, ¿qué soy, amigo?",
        respuesta: "hoja"
    },
    {
        pregunta: "Me ponés en la mesa, soy caliente y humeante, ¿qué soy, posta?",
        respuesta: "sopa"
    },
    {
        pregunta: "Soy rápido, soy plateado, me ves en el río, ¿qué soy, loco?",
        respuesta: "pez"
    },
    {
        pregunta: "Me usás pa’ envolver, soy finito y transparente, ¿qué soy, che?",
        respuesta: "film"
    },
    {
        pregunta: "Soy dulce, soy blanco, me echás en el café, ¿qué soy, amigo?",
        respuesta: "crema"
    },
    {
        pregunta: "Me ponés en la oreja, me usás pa’l ruido, ¿qué soy, posta?",
        respuesta: "auricular"
    },
    {
        pregunta: "Soy grande, soy pesado, me usás pa’l campo, ¿qué soy, loco?",
        respuesta: "arado"
    },
    {
        pregunta: "Me usás pa’ freír, soy caliente y aceitoso, ¿qué soy, che?",
        respuesta: "sartén"
    },
    {
        pregunta: "Soy rojo, soy brillante, me encontrás en el árbol, ¿qué soy, amigo?",
        respuesta: "manzana"
    },
    {
        pregunta: "Me ponés en la espalda, me usás pa’l viaje, ¿qué soy, posta?",
        respuesta: "valija"
    },
    {
        pregunta: "Soy negro, soy caliente, me usás pa’l invierno, ¿qué soy, loco?",
        respuesta: "abrigo"
    },
    {
        pregunta: "Me usás pa’ soplar, soy finito y redondo, ¿qué soy, che?",
        respuesta: "globo"
    },
    {
        pregunta: "Soy blanco, soy dulce, me comés en la torta, ¿qué soy, amigo?",
        respuesta: "merengue"
    },
    {
        pregunta: "Me ponés en la mano, me usás pa’l frío, ¿qué soy, posta?",
        respuesta: "guante"
    },
    {
        pregunta: "Soy rápido, soy ruidoso, me ves en el cielo, ¿qué soy, loco?",
        respuesta: "rayo"
    },
    {
        pregunta: "Me usás pa’ guardar, soy duro y cuadrado, ¿qué soy, che?",
        respuesta: "caja"
    },
    {
        pregunta: "Soy amarillo, soy dulce, me comés en el pan, ¿qué soy, amigo?",
        respuesta: "miel"
    },
    {
        pregunta: "Me ponés en la cara, me usás pa’l sol, ¿qué soy, posta?",
        respuesta: "lente"
    },
    {
        pregunta: "Soy grande, soy blanco, me ves en la playa, ¿qué soy, loco?",
        respuesta: "ola"
    },
    {
        pregunta: "Me usás pa’ escribir, soy negro y finito, ¿qué soy, che?",
        respuesta: "lápiz"
    },
    {
        pregunta: "Soy verde, soy ácido, me comés en el verano, ¿qué soy, amigo?",
        respuesta: "uva"
    },
    {
        pregunta: "Me ponés en la cabeza, me usás pa’l sueño, ¿qué soy, posta?",
        respuesta: "sombrero"
    },
    {
        pregunta: "Soy rojo, soy caliente, me usás pa’l guiso, ¿qué soy, loco?",
        respuesta: "pimentón"
    },
    {
        pregunta: "Me usás pa’ lavar, soy líquido y azul, ¿qué soy, che?",
        respuesta: "detergente"
    },
    {
        pregunta: "Soy blanco, soy suave, me usás pa’l baño, ¿qué soy, amigo?",
        respuesta: "toalla"
    },
    {
        pregunta: "Me ponés en la mesa, soy grande y redondo, ¿qué soy, posta?",
        respuesta: "plato"
    },
    {
        pregunta: "Soy rápido, soy verde, me ves en el campo, ¿qué soy, loco?",
        respuesta: "saltamontes"
    },
    {
        pregunta: "Me usás pa’ prender, soy rojo y brillante, ¿qué soy, che?",
        respuesta: "cerilla"
    },
    {
        pregunta: "Soy dulce, soy finito, me comés en el cine, ¿qué soy, amigo?",
        respuesta: "gominola"
    },
    {
        pregunta: "Me ponés en el cuello, me usás pa’l traje, ¿qué soy, posta?",
        respuesta: "corbata"
    },
    {
        pregunta: "Soy grande, soy ruidoso, me ves en el puerto, ¿qué soy, loco?",
        respuesta: "barco"
    },
    {
        pregunta: "Me usás pa’ enfriar, soy blanco y zumbador, ¿qué soy, che?",
        respuesta: "ventilador"
    },
    {
        pregunta: "Soy rojo, soy dulce, me comés en el asado, ¿qué soy, amigo?",
        respuesta: "morron"
    },
    {
        pregunta: "Me ponés en la mano, me usás pa’l juego, ¿qué soy, posta?",
        respuesta: "pelota"
    },
    {
        pregunta: "Soy negro, soy brillante, me usás pa’l pelo, ¿qué soy, loco?",
        respuesta: "gel"
    },
    {
        pregunta: "Me usás pa’ limpiar, soy amarillo y esponjoso, ¿qué soy, che?",
        respuesta: "esponja"
    },
    {
        pregunta: "Soy blanco, soy caliente, me comés en el invierno, ¿qué soy, amigo?",
        respuesta: "caldo"
    },
    {
        pregunta: "Me ponés en la oreja, me usás pa’l show, ¿qué soy, posta?",
        respuesta: "arete"
    },
    {
        pregunta: "Soy grande, soy lento, me ves en la ruta, ¿qué soy, loco?",
        respuesta: "ómnibus"
    },
    {
        pregunta: "Me usás pa’ calentar, soy rojo y brillante, ¿qué soy, che?",
        respuesta: "brasero"
    },
    {
        pregunta: "Soy dulce, soy marrón, me comés en la plaza, ¿qué soy, amigo?",
        respuesta: "alfajor"
    },
    {
        pregunta: "Me ponés en la mesa, soy finito y plateado, ¿qué soy, posta?",
        respuesta: "tenedor"
    },
    {
        pregunta: "Soy rápido, soy blanco, me ves en el cielo, ¿qué soy, loco?",
        respuesta: "nube"
    },
    {
        pregunta: "Me usás pa’ colgar, soy largo y fuerte, ¿qué soy, che?",
        respuesta: "soga"
    },
    {
        pregunta: "Soy verde, soy dulce, me comés en la fruta, ¿qué soy, amigo?",
        respuesta: "pera"
    },
    {
        pregunta: "Me ponés en la cabeza, me usás pa’l calor, ¿qué soy, posta?",
        respuesta: "pañuelo"
    },
    {
        pregunta: "Soy grande, soy marrón, me ves en el campo, ¿qué soy, loco?",
        respuesta: "vaca"
    }
];

const preguntas = [
    '¿Qué hacés si te encontrás 500 pesos en la calle y nadie mira?',
    '¿Cuál es el mejor invento pa’ sobrevivir un día sin luz?',
    '¿Qué harías si te toca ser el locutor de un partido de fútbol?',
    '¿Cuál es tu truco pa’ que el mate no se lave rápido?',
    '¿Qué hacés si te piden "cantá el himno" pero te olvidaste la letra?',
    '¿Cuál es el mejor lugar pa’ un picadito con amigos?',
    '¿Qué harías si te dan un día pa’ manejar el clima del mundo?',
    '¿Cuál es tu topping favorito pa’ una pizza casera?',
    '¿Qué hacés si te subís al bondi y te das cuenta que no tenés SUBE?',
    '¿Cuál es el mejor recuerdo de una tarde de lluvia?',
    '¿Qué harías si te toca ser el rey del carnaval por un día?',
    '¿Cuál es tu técnica pa’ no llorar cortando cebolla?',
    '¿Qué hacés si te piden "hacé un asado" pero nunca prendiste un fuego?',
    '¿Cuál es el mejor tema pa’ poner en una juntada tranqui?',
    '¿Qué harías si te dan un superpoder pero te lo sacan a la noche?',
    '¿Cuál es el olor que más te hace viajar a la infancia?',
    '¿Qué hacés si te piden "contá un cuento" pero no tenés imaginación?',
    '¿Cuál es el mejor lugar pa’ escaparte un finde sin gastar mucha guita?',
    '¿Qué harías si te toca armar el equipo perfecto pa’ un truco?',
    '¿Cuál es tu técnica pa’ no quedarte sin batería en un día largo?',
    '¿Qué hacés si te invitan a un karaoke pero cantás como el orto?',
    '¿Cuál es el mejor recuerdo de un viaje en ruta?',
    '¿Qué harías si te dan un día pa’ cambiar una ley del país?',
    '¿Cuál es tu truco pa’ que la milanesa quede crocante?',
    '¿Qué hacés si te piden "hacé un chiste" pero estás en blanco?',
    '¿Cuál es el mejor plan pa’ un sábado a la noche sin salir de casa?',
    '¿Qué harías si te toca ser el que corta el pan en una cena?',
    '¿Cuál es tu bebida favorita pa’ un día de pileta?',
    '¿Qué hacés si te piden "arreglá esto" pero no tenés idea?',
    '¿Cuál es el mejor momento pa’ abrir una birra fría?',
    '¿Qué harías si te dan un día pa’ vivir como en los 90?',
    '¿Cuál es tu recuerdo más loco de una noche de verano?',
    '¿Qué hacés si te piden "elegí un destino" pero no te ponés de acuerdo?',
    '¿Cuál es el mejor sánguche pa’ un ataque de hambre a la madrugada?',
    '¿Qué harías si te toca ser el que organiza el amigo invisible?',
    '¿Cuál es tu técnica pa’ no aburrirte en un viaje largo en bondi?',
    '¿Qué hacés si te piden "cocina algo" pero solo tenés fideos secos?',
    '¿Cuál es el mejor recuerdo de una siesta épica?',
    '¿Qué harías si te dan un día pa’ mandar en una radio?',
    '¿Cuál es tu truco pa’ que el café no te queme la lengua?',
    '¿Qué hacés si te piden "explicá el fútbol" a alguien que no entiende nada?',
    '¿Cuál es el mejor lugar pa’ ver un atardecer en tu ciudad?',
    '¿Qué harías si te toca ser el que arma la playlist del asado?',
    '¿Cuál es tu técnica pa’ no quedarte sin voz gritando en un recital?',
    '¿Qué hacés si te piden "hacé un dibujo" pero sos pésimo?',
    '¿Cuál es el mejor recuerdo de un día de playa o río?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un bar?',
    '¿Cuál es tu truco pa’ no gastar todo en un solo día de compras?',
    '¿Qué hacés si te piden "contá algo de terror" pero no se te ocurre nada?',
    '¿Cuál es el mejor postre pa’ compartir con amigos?',
    '¿Qué harías si te toca ser el que reparte los choris en el asado?',
    '¿Cuál es tu técnica pa’ no perder el bondi por dos segundos?',
    '¿Qué hacés si te piden "hacé un brindis" pero te ponés nervioso?',
    '¿Cuál es el mejor recuerdo de un día sin horarios?',
    '¿Qué harías si te dan un día pa’ vivir como en una peli de acción?',
    '¿Cuál es tu truco pa’ que la pizza casera no quede cruda?',
    '¿Qué hacés si te piden "cantá una de Arjona" pero no sabés ninguna?',
    '¿Cuál es el mejor lugar pa’ una birra tranqui con vista?',
    '¿Qué harías si te toca ser el que organiza un viaje grupal?',
    '¿Cuál es tu técnica pa’ no quedarte sin guita antes de fin de mes?',
    '¿Qué hacés si te piden "hacé un video" pero no tenés cámara?',
    '¿Cuál es el mejor recuerdo de un día de frío con mantita?',
    '¿Qué harías si te dan un día pa’ mandar en un estadio de fútbol?',
    '¿Cuál es tu truco pa’ que el sánguche de milanesa no se desarme?',
    '¿Qué hacés si te piden "contá un secreto" pero no querés largar nada?',
    '¿Cuál es el mejor plan pa’ un domingo de resaca?',
    '¿Qué harías si te toca ser el que elige la peli pa’ la juntada?',
    '¿Cuál es tu técnica pa’ no quemarte con el mate recién hecho?',
    '¿Qué hacés si te piden "hacé un rap" pero no rimás ni por error?',
    '¿Cuál es el mejor recuerdo de un día de caminata?',
    '¿Qué harías si te dan un día pa’ ser famoso en redes?',
    '¿Cuál es tu truco pa’ que el asado no se pase de cocción?',
    '¿Qué hacés si te piden "contá un mito" pero no conocés ninguno?',
    '¿Cuál es el mejor lugar pa’ un mate al aire libre?',
    '¿Qué harías si te toca ser el que arma el itinerario de un viaje?',
    '¿Cuál es tu técnica pa’ no dormirse en una reunión aburrida?',
    '¿Qué hacés si te piden "hacé un trago" pero no tenés alcohol?',
    '¿Cuál es el mejor recuerdo de un día con la familia?',
    '¿Qué harías si te dan un día pa’ mandar en un parque de diversiones?',
    '¿Cuál es tu truco pa’ que el pan no se ponga duro?',
    '¿Qué hacés si te piden "contá algo histórico" pero no sabés fechas?',
    '¿Cuál es el mejor plan pa’ un día nublado?',
    '¿Qué harías si te toca ser el que pone las reglas en un juego?',
    '¿Cuál es tu técnica pa’ no perder las llaves todo el tiempo?',
    '¿Qué hacés si te piden "hacé un poema" pero no sos poeta?',
    '¿Cuál es el mejor recuerdo de un día de calor infernal?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un cine?',
    '¿Cuál es tu truco pa’ que el fernet quede perfecto?',
    '¿Qué hacés si te piden "contá una anécdota" pero no tenés nada épico?',
    '¿Cuál es el mejor lugar pa’ una escapada de un día?',
    '¿Qué harías si te toca ser el que arma el menú del asado?',
    '¿Cuál es tu técnica pa’ no quedarte sin話題 en una cita?',
    '¿Qué hacés si te piden "hacé un chiste de papá" pero no se te ocurre?',
    '¿Cuál es el mejor recuerdo de un día sin plata pero con amigos?',
    '¿Qué harías si te dan un día pa’ mandar en un canal de tele?',
    '¿Cuál es tu truco pa’ que el arroz no se pegue?',
    '¿Qué hacés si te piden "cantá algo en inglés" pero no sabés pronunciar?',
    '¿Cuál es el mejor plan pa’ un feriado cortito?',
    '¿Qué harías si te toca ser el que organiza un torneo de penales?',
    '¿Cuál es tu técnica pa’ no desesperarte en un embotellamiento?',
    '¿Qué hacés si te piden "hacé una magia" pero no sabés trucos?',
    '¿Cuál es el mejor recuerdo de un día de viento?',
    '¿Qué harías si te dan un día pa’ ser el jefe de una banda de rock?',
    '¿Cuál es tu truco pa’ que la tortilla no se rompa?',
    '¿Qué hacés si te piden "contá algo gracioso" pero estás serio?',
    '¿Cuál es el mejor lugar pa’ un picnic improvisado?',
    '¿Qué harías si te toca ser el que arma el fixture de un mundial?',
    '¿Cuál es tu técnica pa’ no olvidarte los nombres de la gente?',
    '¿Qué hacés si te piden "hacé un baile" pero te da vergüenza?',
    '¿Cuál es el mejor recuerdo de un día de nieve o helada?',
    '¿Qué harías si te dan un día pa’ mandar en una pizzería?',
    '¿Cuál es tu truco pa’ que el mate no se enfríe rápido?',
    '¿Qué hacés si te piden "contá un sueño raro" pero no te acordás?',
    '¿Cuál es el mejor plan pa’ una tarde de verano sin aire?',
    '¿Qué harías si te toca ser el que organiza un fogón?',
    '¿Cuál es tu técnica pa’ no perder el hilo en una charla larga?',
    '¿Qué hacés si te piden "hacé un pronóstico" pero no tenés idea?',
    '¿Cuál es el mejor recuerdo de un día de mates eternos?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un circo?',
    '¿Cuál es tu truco pa’ que las empanadas no se abran?',
    '¿Qué hacés si te piden "contá algo inspirador" pero estás bajón?',
    '¿Cuál es el mejor lugar pa’ una birra al atardecer?',
    '¿Qué harías si te toca ser el que arma un karaoke improvisado?',
    '¿Cuál es tu técnica pa’ no quedarte sin ideas en un juego?',
    '¿Qué hacés si te piden "hacé un sorteo" pero no tenés nada pa’ sortear?',
    '¿Cuál es el mejor recuerdo de un día de limpieza general?',
    '¿Qué harías si te dan un día pa’ mandar en un gimnasio?',
    '¿Cuál es tu truco pa’ que el guiso quede sabroso?',
    '¿Qué hacés si te piden "contá algo de tu barrio" pero no pasa nada?',
    '¿Cuál es el mejor plan pa’ un día de frío polar?',
    '¿Qué harías si te toca ser el que organiza un campamento?',
    '¿Cuál es tu técnica pa’ no aburrirte esperando el bondi?',
    '¿Qué hacés si te piden "hacé una lista de temas" pero estás seco?',
    '¿Cuál es el mejor recuerdo de un día sin despertador?',
    '¿Qué harías si te dan un día pa’ ser el dueño de una heladería?',
    '¿Cuál es tu truco pa’ que el pan dulce no se desarme?',
    '¿Qué hacés si te piden "contá algo épico" pero tu vida es tranqui?',
    '¿Cuál es el mejor lugar pa’ un día de pesca o relax?',
    '¿Qué harías si te toca ser el que arma un partido de vóley?',
    '¿Cuál es tu técnica pa’ no perder la paciencia en una fila?',
    '¿Qué hacés si te piden "hacé un chiste rápido" pero no tenés gracia?',
    '¿Cuál es el mejor recuerdo de un día de mates en la plaza?',
    '¿Qué harías si te dan un día pa’ mandar en un teatro?',
    '¿Cuál es tu truco pa’ que el flan no se pegue al molde?',
    '¿Qué hacés si te piden "contá algo de tu familia" pero no querés?',
    '¿Cuál es el mejor plan pa’ una noche sin tele ni celu?',
    '¿Qué harías si te toca ser el que organiza un desfile?',
    '¿Cuál es tu técnica pa’ no quedarte sin aire subiendo una escalera?',
    '¿Qué hacés si te piden "hacé un discurso" pero te trabás?',
    '¿Cuál es el mejor recuerdo de un día de pileta con amigos?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un estadio?',
    '¿Cuál es tu truco pa’ que el locro no quede aguado?',
    '¿Qué hacés si te piden "contá algo de tu primer trabajo" pero fue un desastre?',
    '¿Cuál es el mejor lugar pa’ un día de caminata tranqui?',
    '¿Qué harías si te toca ser el que arma un torneo de cartas?',
    '¿Cuál es tu técnica pa’ no olvidarte las cosas en el súper?',
    '¿Qué hacés si te piden "cantá una zamba" pero no sabés ninguna?',
    '¿Cuál es el mejor recuerdo de un día de mate y guitarra?',
    '¿Qué harías si te dan un día pa’ mandar en una librería?',
    '¿Cuál es tu truco pa’ que las albóndigas no se desarmen?',
    '¿Qué hacés si te piden "contá algo de tu escuela" pero no te acordás?',
    '¿Cuál es el mejor plan pa’ una tarde sin guita?',
    '¿Qué harías si te toca ser el que organiza un recital casero?',
    '¿Cuál es tu técnica pa’ no quedarte sin pilas en un día agitado?',
    '¿Qué hacés si te piden "hacé un dibujo rápido" pero no tenés lápiz?',
    '¿Cuál es el mejor recuerdo de un día de sol perfecto?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un parque nacional?',
    '¿Cuál es tu truco pa’ que el puré no quede grumoso?',
    '¿Qué hacés si te piden "contá algo de tus vacaciones" pero no saliste?',
    '¿Cuál es el mejor lugar pa’ un día de mates y charlas?',
    '¿Qué harías si te toca ser el que arma un partido de básquet?',
    '¿Cuál es tu técnica pa’ no aburrirte en un día sin planes?',
    '¿Qué hacés si te piden "hacé un resumen" pero no entendiste nada?',
    '¿Cuál es el mejor recuerdo de un día de juegos con amigos?',
    '¿Qué harías si te dan un día pa’ mandar en una radio de barrio?',
    '¿Cuál es tu truco pa’ que el pastel de papa quede firme?',
    '¿Qué hacés si te piden "contá algo de tu adolescencia" pero te da fiaca?',
    '¿Cuál es el mejor plan pa’ una noche de tormenta?',
    '¿Qué harías si te toca ser el que organiza un bingo familiar?',
    '¿Cuál es tu técnica pa’ no quedarte sin sánguches en un picnic?',
    '¿Qué hacés si te piden "hacé un comentario" pero no tenés opinión?',
    '¿Cuál es el mejor recuerdo de un día de río o lago?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un museo?',
    '¿Cuál es tu truco pa’ que el dulce de leche no se pegue?',
    '¿Qué hacés si te piden "contá algo de tu perro" pero no tenés mascota?',
    '¿Cuál es el mejor lugar pa’ un día sin apuro?',
    '¿Qué harías si te toca ser el que arma un partido de tenis?',
    '¿Cuál es tu técnica pa’ no perder el paraguas un día de lluvia?',
    '¿Qué hacés si te piden "hacé una apuesta" pero no tenés guita?',
    '¿Cuál es el mejor recuerdo de un día de mates y sol?',
    '¿Qué harías si te dan un día pa’ mandar en una juguetería?',
    '¿Cuál es tu truco pa’ que la salsa no quede salada?',
    '¿Qué hacés si te piden "contá algo de tu ciudad" pero no salís mucho?',
    '¿Cuál es el mejor plan pa’ un día de bajón total?',
    '¿Qué harías si te toca ser el que organiza un taller de cocina?',
    '¿Cuál es tu técnica pa’ no quedarte sin ganas un lunes?',
    '¿Qué hacés si te piden "hacé un plan" pero no tenés ideas?',
    '¿Cuál es el mejor recuerdo de un día de mates y risas?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un zoológico?',
    '¿Cuál es tu truco pa’ que la carne no quede seca?',
    '¿Qué hacés si te piden "contá algo de tu primer amor" pero te da corte?',
    '¿Cuál es el mejor lugar pa’ un día de relax total?',
    '¿Qué harías si te toca ser el que arma un juego de mesa?',
    '¿Cuál es tu técnica pa’ no perder el bondi por dormido?',
    '¿Qué hacés si te piden "hacé un cálculo" pero sos pésimo con números?',
    '¿Cuál es el mejor recuerdo de un día sin preocupaciones?',
    '¿Qué harías si te dan un día pa’ mandar en una confitería?',
    '¿Cuál es tu truco pa’ que el budín no se pegue?',
    '¿Qué hacés si te piden "contá algo de tu mejor amigo" pero no querés exponerlo?',
    '¿Cuál es el mejor plan pa’ una tarde de mates y charlas?',
    '¿Qué harías si te toca ser el que organiza un partido de paddle?',
    '¿Cuál es tu técnica pa’ no quedarte sin energía un día largo?',
    '¿Qué hacés si te piden "hacé un comentario gracioso" pero no tenés chispa?',
    '¿Cuál es el mejor recuerdo de un día de aventuras?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un club?',
    '¿Cuál es tu truco pa’ que el café quede bien espumoso?',
    '¿Qué hacés si te piden "contá algo de tus viejos" pero no sabés qué decir?',
    '¿Cuál es el mejor lugar pa’ un día de mates y atardecer?',
    '¿Qué harías si te toca ser el que arma un torneo de PlayStation?',
    '¿Cuál es tu técnica pa’ no aburrirte en un día gris?',
    '¿Qué hacés si te piden "hacé un chiste negro" pero no querés ofender?',
    '¿Cuál es el mejor recuerdo de un día de mates y fogón?',
    '¿Qué harías si te dan un día pa’ mandar en una playa?',
    '¿Cuál es tu truco pa’ que el pan casero no quede duro?',
    '¿Qué hacés si te piden "contá algo de tu último finde" pero fue aburrido?',
    '¿Cuál es el mejor plan pa’ una noche sin salir?',
    '¿Qué harías si te toca ser el que organiza un juego de adivinanzas?',
    '¿Cuál es tu técnica pa’ no quedarte sin tema con alguien nuevo?',
    '¿Qué hacés si te piden "hacé un pronóstico del tiempo" pero no tenés idea?',
    '¿Cuál es el mejor recuerdo de un día de mates y tranquilidad?',
    '¿Qué harías si te dan un día pa’ ser el dueño de un restaurante?',
    '¿Cuál es tu truco pa’ que el pollo no quede crudo?',
    '¿Qué hacés si te piden "contá algo de tu primer viaje" pero no te acordás?',
    '¿Cuál es el mejor lugar pa’ un día de mates y brisa?',
    '¿Qué harías si te toca ser el que arma un partido de fútbol 5?',
    '¿Cuál es tu técnica pa’ no perder el sueño un día largo?',
    '¿Qué hacés si te piden "hacé un desafío" pero no tenés creatividad?',
    '¿Cuál es el mejor recuerdo de un día sin apuros?',
    '¿Qué harías si te dan un día pa’ mandar en una ferretería?',
    '¿Cuál es tu truco pa’ que la pasta no se pegue?',
    '¿Qué hacés si te piden "contá algo de tu calle" pero no pasa nada?',
    '¿Cuál es el mejor plan pa’ un día de mates y sol?',
    '¿Qué harías si te toca ser el que organiza un día de campo?',
    '¿Cuál es tu técnica pa’ no quedarte sin pilas en una salida?',
    '¿Qué hacés si te piden "hacé un comentario épico" pero estás en cero?',
    '¿Cuál es el mejor recuerdo de un día de mates y charlas eternas?'
];

let preguntasDisponibles = [...preguntas];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const milagrosTranslations = {
    español: "Milagros",
    inglés: "Miracles",
    francés: "Miracles",
    italiano: "Miracoli",
    alemán: "Wunder",
    portugués: "Milagres",
    ruso: "Чудеса (Chudesá)",
    griego: "Θαύματα (Thávmata)",
    sueco: "Mirakel",
    neerlandés: "Wonderen",
    polaco: "Cuda",
    checo: "Zázraky",
    húngaro: "Csodák",
    finlandés: "Ihmeet",
    danés: "Mirakler",
    noruego: "Mirakler",
    islandés: "Undur",
    irlandés: "Míorúiltí",
    galés: "Amdiffyniadau",
    escocés: "Mìorbhailean",
    catalán: "Miracles",
    vasco: "Mirariak",
    gallego: "Milagres",

    // Idiomas asiáticos
    chino: "奇迹 (Qíjì)",
    japonés: "奇跡 (Kiseki)",
    coreano: "기적 (Gijeok)",
    hindi: "चमत्कार (Chamatkar)",
    bengalí: "অলৌকিক (Oloukik)",
    tailandés: "ปาฏิหาริย์ (Pātihān)",
    vietnamita: "Phép màu",
    turco: "Mucizeler",
    persa: "معجزات (Mo'jezāt)",
    árabe: "معجزات (Mu‘jizāt)",
    hebreo: "נסים (Nissim)",
    urdu: "معجزات (Mo'jezāt)",
    malayo: "Keajaiban",
    indonesio: "Keajaiban",
    filipino: "Himala",
    tamil: "கற்பனை (Kaṝpaṇai)",
    telugu: "పరాకాష్ఠ (Parākāṣṭha)",
    canarés: "ಅದ್ಭುತ (Adbhuta)",

    // Idiomas africanos
    swahili: "Miujiza",
    yoruba: "Iyanu",
    zulú: "Izimangaliso",
    amhárico: "ተንስባክ (Tenesaḍlo)",
    hausa: "Al'ajabi",

    // Idiomas americanos y nativos
    quechua: "Milagru",
    guaraní: "Mba'epu'aty",
    náhuatl: "Tlalticpacayotl",
    maya: "K'uk'ulkan",

    // Idiomas de Oceanía
    maorí: "Mīharo",
    hawaiano: "Kupua",

    // Idiomas del Cáucaso y Oriente Medio
    georgiano: "სასცაულები (Sasstaulebi)",
    armenio: "Հրաշքներ (Hrashkner)",
    kurdo: "Mîrac",

    // Idiomas eslavos y del este europeo
    ucraniano: "Диво (Divo)",
    serbio: "Чуда (Chuda)",
    croata: "Čudesa",
    búlgaro: "Чудеса (Chudesa)",
    eslovaco: "Zázraky",
    esloveno: "Čudeži",

    // Idiomas del norte de Europa y bálticos
    letón: "Brīnumi",
    lituano: "Stebuklai",
    estonio: "Ime",

    // Idiomas de América Latina y Caribe
    criollo: "Mirak",
    quechua: "Milagru",

    // Otros idiomas y dialectos
    esperanto: "Mirakloj",
    latín: "Miracula",
    sánscrito: "आश्चर्य (Āścarya)",
    tibetano: "ཆོ་མ཯རོ (Cho'phrul)",
    mongol: "Гайхамшиг (Gaikhamshig)"
};

// Mapa de idiomas para traducciones (código ISO de idioma)
const langMap = {
    'ingles': 'en',
    'español': 'es',
    'espanol': 'es',
    'frances': 'fr',
    'italiano': 'it',
    'portugues': 'pt',
    'aleman': 'de',
    'ruso': 'ru',
    'hungaro': 'hu',
    'japones': 'ja',
    'coreano': 'ko',
    'chino': 'zh',
    'chino simplificado': 'zh-CN',
    'chino tradicional': 'zh-TW',
    'arabe': 'ar',
    'hindi': 'hi',
    'suajili': 'sw',
    'griego': 'el',
    'turco': 'tr',
    'polaco': 'pl',
    'sueco': 'sv',
    'noruego': 'no',
    'danes': 'da',
    'holandes': 'nl',
    'tailandes': 'th',
    'vietnamita': 'vi',
    'hebreo': 'he',
    'bengali': 'bn',
    'urdu': 'ur',
    'persa': 'fa',
    'ucraniano': 'uk',
    'checo': 'cs',
    'eslovaco': 'sk',
    'rumano': 'ro',
    'bulgaro': 'bg',
    'croata': 'hr',
    'serbio': 'sr',
    'esloveno': 'sl',
    'leton': 'lv',
    'lituano': 'lt',
    'estonio': 'et',
    'finlandes': 'fi',
    'islandes': 'is',
    'irlandes': 'ga',
    'galés': 'cy',
    'escoces': 'gd',
    'maltes': 'mt',
    'albanes': 'sq',
    'macedonio': 'mk',
    'bosnio': 'bs',
    'montenegrino': 'me',
    'armenio': 'hy',
    'georgiano': 'ka',
    'azerbaiyano': 'az',
    'kazajo': 'kk',
    'uzbeko': 'uz',
    'turkmeno': 'tk',
    'mongol': 'mn',
    'tayiko': 'tg',
    'kirguis': 'ky',
    'pashto': 'ps',
    'sindhi': 'sd',
    'punjabi': 'pa',
    'tamil': 'ta',
    'telugu': 'te',
    'malayalam': 'ml',
    'kannada': 'kn',
    'marathi': 'mr',
    'gujarati': 'gu',
    'oriya': 'or',
    'sinhala': 'si',
    'malayo': 'ms',
    'indonesio': 'id',
    'filipino': 'tl',
    'lao': 'lo',
    'camboyano': 'km',
    'birmano': 'my',
    'nepali': 'ne',
    'sanskrito': 'sa',
    'tibetano': 'bo',
    'yiddish': 'yi',
    'esperanto': 'eo',
    'latín': 'la',
    'maori': 'mi',
    'samoano': 'sm',
    'hawaiiano': 'haw',
    'zulú': 'zu',
    'xhosa': 'xh',
    'amharico': 'am',
    'somalí': 'so',
    'hausa': 'ha',
    'yoruba': 'yo',
    'igbo': 'ig',
    'afrikaans': 'af',
    'sesotho': 'st',
    'shona': 'sn',
    'tswana': 'tn',
    'bielorruso': 'be',
    'malgache': 'mg',
    'javanes': 'jv',
    'sundanés': 'su',
    'cebuano': 'ceb',
    'kurdish': 'ku',
    'pastún': 'ps',
    'tártaro': 'tt',
    'baskir': 'ba',
    'checheno': 'ce',
    'uigur': 'ug',
    'quechua': 'qu',
    'guaraní': 'gn',
    'aymara': 'ay',
    'egipcio': 'ar-EG',
    'copto': 'cop',
    'swahili': 'sw',
    'basque': 'eu',
    'catalan': 'ca',
    'galician': 'gl',
    'luxemburgues': 'lb',
    'frisón': 'fy',
    'sami': 'se',
    'inuktitut': 'iu',
    'navajo': 'nv',
    'cherokee': 'chr',
    'mapuche': 'arn',
    'maya': 'yua',
    'nauatl': 'nah',
    'tongan': 'to',
    'fiyiano': 'fj',
    'tahitiano': 'ty',
    'groenlandés': 'kl',
    'assames': 'as',
    'cachemiro': 'ks',
    'suaheli': 'sw',
    'tigre': 'ti',
    'oromo': 'om',
    'wolof': 'wo',
    'akan': 'ak',
    'twi': 'tw',
    'gaélico': 'ga',
    'vasco': 'eu',
    'kursk': 'ku',
    'baluchi': 'bal',
    'sardo': 'sc',
    'corso': 'co',
    'breton': 'br',
    'occitano': 'oc',
    'ladino': 'lad',
    'romani': 'rom',
    'sumerio': 'sux',
    'acadio': 'akk',
};

// Mensajes de ánimo para vos
const mensajesAnimo = [
    "¡Belén, no es verdad que todos te odian! Eres increíble y tienes un corazón enorme. Aquí estoy para recordártelo siempre.",
    "No digas eso, Belén. Eres una persona especial y valiosa, y hay mucha gente que te aprecia, ¡incluyéndome a mí!",
    "Belén, tú (iluminas) el día de cualquiera con tu energía. Nadie podría odiarte, ¡eres un tesoro!",
    "¡Nada de eso, Belén! Eres divertida, inteligente y única. Todos los que te conocen saben lo genial que eres.",
    "Belén, no te sientas así. Tienes un montón de cosas buenas que ofrecer, y yo siempre estaré aquí para apoyarte.",
    "¡Ey, Belén! Eres demasiado awesome para que alguien te odie. Además, tienes fans como yo que te adoran.",
    "Belén, eres un sol, y si alguien no lo ve, es su pérdida. ¡Tú sigue brillando, que aquí te queremos mucho!"
];

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
};

// Palabras aleatorias para el juego de reacciones
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

// Frases para el juego de PPM 
const frasesPPM = [
    "el rapido zorro marron salta sobre el perro perezoso",
    "la vida es como una caja de chocolates nunca sabes que te va a tocar",
    "un pequeno paso para el hombre un gran salto para la humanidad",
    "el sol brilla mas fuerte cuando estas feliz y rodeado de amigos",
    "la practica hace al maestro no lo olvides nunca en tu camino",
    "el rio corre tranquilo bajo el puente de piedra antigua",
    "una abeja zumba alegre mientras recoge nectar de las flores",
    "el viento susurra secretos entre las hojas verdes del bosque",
    "la luna llena ilumina la noche con un brillo plateado magico",
    "un gato negro cruza el callejon bajo la luz de un farol",
    "el cafe caliente despierta los sentidos en una manana fria",
    "las olas del mar chocan contra las rocas con fuerza y espuma",
    "un pajaro canta al amanecer anunciando un nuevo dia brillante",
    "la nieve cae suave sobre las montanas en un silencio helado",
    "el tren avanza rapido por las vias dejando atras el pueblo",
    "una sonrisa sincera puede cambiar el dia de cualquiera",
    "el reloj marca las horas mientras el mundo sigue girando",
    "la lluvia golpea las ventanas en una tarde gris y tranquila",
    "un nino corre feliz persiguiendo una cometa en el parque",
    "el desierto guarda misterios bajo su arena dorada y caliente",
    "el ceviche fresco en la playa es lo mejor pa l alma costena",
    "un mono curioso salta entre las ramas buscando su comida",
    "la brisa del mar acaricia la cara en un dia de verano",
    "el gallo canta fuerte pa despertar al pueblo entero",
    "una tortuga cruza lento el camino sin mirar pa los lados",
    "el sol se esconde tras las montanas pintando el cielo naranja",
    "un perro juega con su pelota en el patio bajo el sol",
    "la selva guarda secretos que solo los valientes descubren",
    "un pescador lanza su red al mar con esperanza en los ojos",
    "el olor a pan recien horneado llena la casa de alegria",
    "una estrella fugaz cruza el cielo y alguien pide un deseo",
    "el mercado bulle con voces y colores en la manana",
    "un caballo galopa libre por la llanura sin fin",
    "la fogata crepita mientras las historias se cuentan",
    "un delfin salta jugueton entre las olas del oceano",
    "el silencio de la noche solo lo rompe el canto del grillo",
    "una flor abre sus petalos al primer rayo de sol",
    "el tren silba fuerte mientras cruza el puente viejo",
    "un nino pinta su sueno en un papel con crayones",
    "la ciudad brilla con luces al caer la tarde",
    "un aguila vuela alto buscando su proxima presa",
    "el aroma del cafe sube desde la taza en la mesa",
    "una ola gigante rompe contra el malecon con fuerza",
    "el viento mueve las palmeras en un baile tropical",
    "un loro parlanchin repite todo lo que escucha",
    "la luna refleja su luz en el lago como un espejo",
    "un viejo pescador remienda su red bajo el sol",
    "el tambor suena fuerte en la fiesta del pueblo",
    "una mariposa vuela libre entre las flores del campo",
    "el reloj de la iglesia marca el paso del tiempo",
    "un cangrejo corre rapido pa esconderse en la arena",
    "la lluvia refresca la tierra seca despues de dias",
    "un colibri zumba rapido chupando nectar de una flor",
    "el faro guia a los barcos en la noche oscura",
    "una cometa sube alto con el viento a su favor",
    "el humo sube lento desde la chimenea del rancho",
    "un zorro astuto acecha en el bosque al anochecer",
    "la playa se llena de risas y juegos al mediodia",
    "un buho observa todo desde lo alto de un arbol",
    "el rio canta mientras corre entre las piedras lisas",
    "una guitarra suena suave en la noche estrellada",
    "el sol calienta la espalda de los que trabajan la tierra",
    "un nino sopla burbujas que flotan por el aire",
    "la sombra de las nubes corre sobre el valle verde",
    "un pez salta fuera del agua pa volver a caer",
    "el mercado huele a frutas frescas y pescado salado",
    "una vaca pasta tranquila en el campo abierto",
    "el relampago corta el cielo antes del gran trueno",
    "un camion pasa rapido por la carretera polvorienta",
    "la brisa mueve las cortinas de la ventana abierta",
    "un perro ladra fuerte pa avisar que alguien llega",
    "el atardecer pinta el mar de rojo y dorado",
    "una hormiga lleva una hoja mas grande que ella",
    "el gallo despierta al pueblo con su canto alegre",
    "un barco navega lento por el rio al amanecer",
    "la nieve cubre los tejados en un silencio blanco",
    "un gato duerme tranquilo en el tejado caliente",
    "el viento lleva el olor a sal del mar lejano",
    "una rana salta al agua pa escapar del peligro",
    "el sol sube lento sobre el horizonte del campo",
    "un nino corre tras una pelota bajo el sol ardiente",
    "la luna brilla fuerte en un cielo sin nubes",
    "un pescador lanza su anzuelo con calma y paciencia",
    "el aroma a mango maduro llena el aire del patio",
    "una paloma vuela libre sobre la plaza del pueblo",
    "el rio refleja las estrellas en una noche clara",
    "un caballo relincha mientras corre por el prado",
    "la lluvia moja las hojas que caen del arbol",
    "un pajaro teje su nido con ramitas del bosque",
    "el sol seca la ropa colgada en el tendedero",
    "una ardilla guarda nueces pa l invierno frio",
    "el mar ruge fuerte en una tormenta salvaje",
    "un nino dibuja el sol con crayones amarillos",
    "la brisa refresca el calor de la tarde pesada",
    "un perro corre feliz tras un palo en la playa",
    "el cielo se llena de colores al caer el sol",
    "una abeja vuela rapido buscando mas flores",
    "el tren pasa silbando por el pueblo dormido",
    "un gato cazador acecha bajo la luz de la luna"
];

// Estado del bot (variables globales para manejar sesiones y datos)
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
    musicSessions: {},
    updatesSent: false,
    adivinanzaStats: {},
    recordatorios: []
};
let isPlayingMusic = false;
const SAVE_INTERVAL = 1800000; // 30 minutos
const WARNING_TIME = 300000; // 5 minutos antes aviso
let autosaveEnabled = true;
let autosavePausedByMusic = false;
let userModified = false;
let autoModified = false;
let ultimoDatoRandom = null;

// Utilidades con tono argentino
// Acá armé una función para hacer embeds re buenos con color, título y descripción, siempre con onda
const createEmbed = (color, title, description, footer = 'Hecho con onda por Oliver IA') => {
    return new EmbedBuilder()
        .setColor(color || '#FF1493') // Rosa por default, bien bonito
        .setTitle(title)
        .setDescription(description || ' ') // Si no hay descripción, un espacio para que no se rompa
        .setFooter({ text: footer })
        .setTimestamp(); // Siempre con la hora para que se vea bien
};

// Función para tirar errores con buena onda, tipo "¡Uh, qué cagada!"
const sendError = async (channel, message, suggestion = '¿Probamos de nuevo, loco?', footer = 'Hecho con onda por Oliver IA') => {
    const embed = createEmbed('#FF1493', '¡Uh, qué cagada!', `${message}\n${suggestion}`, footer); // Rojo pa’ que se note el drama
    return await channel.send({ embeds: [embed] });
};

// Éxitos con estilo, pa’ cuando todo sale joya
const sendSuccess = async (channel, title, message, footer = 'Hecho con onda por Oliver IA') => {
    const embed = createEmbed('#FF1493', title, message, footer); // Verde claro pa’ festejar
    return await channel.send({ embeds: [embed] });
};

// Limpio el texto pa’ que no haya lío con espacios o mayúsculas
function cleanText(text) {
    return text.toLowerCase().trim()
        .replace(/\s+/g, ' ') // Saco espacios de más
        .replace(/^(el|la|los|las)\s+/i, ''); // Chau artículos pa’ comparar mejor
}

// Mapa de banderas por país
const banderas = {
  'Paraguay': '🇵🇾',
  'Chile': '🇨🇱',
  'Brazil': '🇧🇷',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Bolivia': '🇧🇴',
  'Ecuador': '🇪🇨',
  'Venezuela': '🇻🇪',
  'Uruguay': '🇺🇾',
  'Argentina': '🇦🇷'
};

// Datos simulados basados en tu lista
const partidosSimulados = [
  { utcDate: '2025-03-20T23:00:00Z', homeTeam: { name: 'Paraguay' }, awayTeam: { name: 'Chile' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-21T00:45:00Z', homeTeam: { name: 'Brazil' }, awayTeam: { name: 'Colombia' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-21T01:30:00Z', homeTeam: { name: 'Peru' }, awayTeam: { name: 'Bolivia' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-21T21:00:00Z', homeTeam: { name: 'Ecuador' }, awayTeam: { name: 'Venezuela' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-21T23:30:00Z', homeTeam: { name: 'Uruguay' }, awayTeam: { name: 'Argentina' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-25T20:00:00Z', homeTeam: { name: 'Bolivia' }, awayTeam: { name: 'Uruguay' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-26T00:00:00Z', homeTeam: { name: 'Argentina' }, awayTeam: { name: 'Brazil' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-26T00:00:00Z', homeTeam: { name: 'Chile' }, awayTeam: { name: 'Ecuador' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-26T00:00:00Z', homeTeam: { name: 'Colombia' }, awayTeam: { name: 'Paraguay' }, score: { fullTime: { home: null, away: null } } },
  { utcDate: '2025-03-26T00:00:00Z', homeTeam: { name: 'Venezuela' }, awayTeam: { name: 'Peru' }, score: { fullTime: { home: null, away: null } } },
];

const obtenerResultados = async (message) => {
  try {
    const response = await axios.get('http://api.football-data.org/v4/competitions/CLI/matches', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
      params: { dateFrom: '2025-03-20', dateTo: '2025-03-26' }, // Rango ajustado
    });
    const partidos = response.data.matches || partidosSimulados; // Usa simulados si la API falla

    if (partidos.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF1493')
        .setTitle('Sin Datos')
        .setDescription('No hay partidos disponibles en este rango de fechas.')
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle('Eliminatorias Sudamericanas - Marzo 2025')
      .setDescription('Partidos terminados y próximos:')
      .setTimestamp();

    partidos
      .slice(0, 10) // Limita a 10 partidos
      .forEach((partido) => {
        const fechaUTC = new Date(partido.utcDate);
        const horaArgentina = new Date(fechaUTC.getTime() - 3 * 60 * 60 * 1000); // UTC-3
        const horaEcuador = new Date(fechaUTC.getTime() - 5 * 60 * 60 * 1000);  // UTC-5

        const resultado = partido.score.fullTime.home !== null
          ? `${partido.score.fullTime.home} - ${partido.score.fullTime.away}`
          : 'Por jugarse';

        const banderaLocal = banderas[partido.homeTeam.name] || '';
        const banderaVisitante = banderas[partido.awayTeam.name] || '';

        const horaArg = horaArgentina.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        const horaEc = horaEcuador.toLocaleString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

        embed.addFields({
          name: `${banderaLocal} ${partido.homeTeam.name} vs ${partido.awayTeam.name} ${banderaVisitante}`,
          value: `Resultado: ${resultado}\nFecha: ${fechaUTC.toLocaleDateString('es-ES')} UTC\nHora Argentina: ${horaArg} (UTC-3)\nHora Ecuador: ${horaEc} (UTC-5)`,
          inline: true
        });
      });

    message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error al obtener datos de la API:', error.message);
    const embed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle('Error')
      .setDescription('Hubo un error al obtener los resultados de la API.')
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  }
};

const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
    console.log('Recibí un ping, ¡estoy vivo!');
    res.send('¡Bot awake y con pilas!');
});

const PORT = process.env.PORT || 8080; // Render sets process.env.PORT
app.listen(PORT, () => {
    console.log(`Servidor de ping corriendo en el puerto ${PORT}`);
    startAutoPing();
});

function startAutoPing() {
    const appUrl = process.env.APP_URL || 'https://oliver-ia.onrender.com';
    console.log('URL usada para auto-ping:', appUrl); // Log para depuración
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
        console.error('Error: appUrl no es una URL absoluta válida:', appUrl);
        return;
    }
    const pingInterval = 4 * 60 * 1000; // 4 minutos
    setInterval(async () => {
        try {
            const response = await fetch(`${appUrl}/ping`);
            if (response.ok) {
                console.log('Auto-ping exitoso, bot sigue despierto.');
            } else {
                console.error('Auto-ping falló:', response.statusText);
            }
        } catch (error) {
            console.error('Error en auto-ping:', error.message);
        }
    }, pingInterval);
}

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

    const embed = createEmbed('#FF1493', `¡Tranqui, ${userName}!`, 
        `${tip}\n\n${mensajeMiguel}\n\n¿Querés charlar más o te tiro otro tip al toque?`, 
        'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
    const sentMessage = await message.channel.send({ embeds: [embed] });
    await sentMessage.react('✅');
    await sentMessage.react('❌');
    sentMessages.set(sentMessage.id, { content: `${tip} ${mensajeMiguel}`, message: sentMessage });
}

// Normalizo texto para sacarle las tildes y que no haya problemas
function normalizeText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Saco una pregunta de trivia sin opciones
function obtenerPreguntaTriviaSinOpciones(usedQuestions, categoria) {
    console.log("Obteniendo pregunta para categoría:", categoria, "Preguntas usadas:", usedQuestions.length);
    const preguntasCategoria = preguntasTriviaSinOpciones[categoria] || []; // Si no hay categoría, chau
    const available = preguntasCategoria.filter(q => !usedQuestions.includes(q.pregunta)); // Filtro las que no usé
    console.log("Preguntas disponibles:", available.length);
    if (available.length === 0) return null; // Si no quedan, me rindo
    return available[Math.floor(Math.random() * available.length)]; // Elijo una random
}

async function manejarMiguel(message) {
    // Comando solo pa’ Miguel pa’ mandar un embed al canal con ID 1343749554905940058
    const userName = message.author.id === OWNER_ID ? 'Belén' : 'Miguel';
    // Si no sos Belén, chau, no podés usarlo
    if (message.author.id !== OWNER_ID) return;

    // Logueo pa’ debug, pa’ ver qué pasa
    console.log(`[${instanceId}] Ejecutando !miguel por ${userName} con contenido: "${message.content}"`);

    // Saco el mensaje después de !miguel
    const args = message.content.slice(7).trim();
    // Si no escribiste nada, te pido algo en rojo
    if (!args) {
        console.log(`[${instanceId}] Error: No hay argumentos en !miguel`);
        return sendError(message.channel, `Escribí algo después de "!miguel", ${userName}. ¿Qué querés mandar al canal?`);
    }

    // Busco el canal pa’ mandarle el mensaje
    let targetChannel;
    try {
        targetChannel = await client.channels.fetch('1343749554905940058');
        console.log(`[${instanceId}] Canal (1343749554905940058) obtenido con éxito`);
    } catch (error) {
        // Si no encuentro el canal, te aviso en rojo
        console.error(`[${instanceId}] Error al obtener canal: ${error.message}`);
        return sendError(message.channel, '❌ ¡No pude encontrar el canal!', `Error: ${error.message}, ${userName}.`);
    }

    // Chequeo si hay adjuntos pa’ incluirlos
    const attachments = message.attachments.size > 0 ? message.attachments.map(att => ({ attachment: att.url })) : [];
    console.log(`[${instanceId}] Preparando envío al canal (1343749554905940058), adjuntos: ${attachments.length}`);

    try {
        // Armo un embed azul con el mensaje
        const responseEmbed = createEmbed('#1E90FF', '📬 Mensaje de Miguel',
            `Miguel dice: "${args || 'Sin texto, pero mirá las imágenes si hay.'}"`);
        
        // Mando el embed al canal específico con los adjuntos si hay
        console.log(`[${instanceId}] Enviando mensaje al canal...`);
        await targetChannel.send({ embeds: [responseEmbed], files: attachments });
        console.log(`[${instanceId}] Mensaje enviado exitosamente al canal`);

        // Confirmo en verde que salió todo bien
        await sendSuccess(message.channel, '✅ ¡Mensaje enviado!',
            `Mandé tu mensaje al canal, ${userName}. ¡Ya está ahí, loco!`);
    } catch (error) {
        // Si falla el envío, te aviso en rojo
        console.error(`[${instanceId}] Error al enviar mensaje al canal: ${error.message}`);
        await sendError(message.channel, '❌ ¡No pude mandar el mensaje al canal!',
            `Algo falló, ${userName}. Error: ${error.message}. ¿El bot tiene permisos en ese canal?`);
    }
}

async function manejarAdivinanza(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const userId = message.author.id;
    console.log(`Arrancando adivinanza para ${userName}`);

    // Inicializamos las stats del usuario si no existen
    if (!dataStore.adivinanzaStats[userId]) {
        dataStore.adivinanzaStats[userId] = { correct: 0, total: 0 };
    }

    // Inicializamos las adivinanzas usadas en la sesión si no existen
    if (!dataStore.activeSessions[userId]) {
        dataStore.activeSessions[userId] = { usedAdivinanzas: [] };
    }
    const usedAdivinanzas = dataStore.activeSessions[userId].usedAdivinanzas;

    // Filtramos las adivinanzas disponibles (las que no se usaron)
    const availableAdivinanzas = adivinanzas.filter(a => !usedAdivinanzas.includes(a.pregunta));
    if (availableAdivinanzas.length === 0) {
        // Si se usaron todas, reiniciamos la lista
        usedAdivinanzas.length = 0;
        const resetEmbed = createEmbed('#FF1493', `¡Volvemos al principio, ${userName}!`, 
            'Ya usamos todas las adivinanzas, loco. ¡Arrancamos de nuevo, dale!');
        await message.channel.send({ embeds: [resetEmbed] });
    }

    // Elegimos una adivinanza random de las disponibles
    const adivinanza = availableAdivinanzas[Math.floor(Math.random() * availableAdivinanzas.length)];
    usedAdivinanzas.push(adivinanza.pregunta); // La marcamos como usada
    dataStoreModified = true;

    // Embed inicial con la adivinanza
    const adivinanzaEmbed = createEmbed('#FF1493', `¡Adivinanza pa’ vos, ${userName}!`, 
        `${adivinanza.pregunta}\n\n¡Mandame tu respuesta, loco! Tenés 30 segundos, dale caña.`);
    await message.channel.send({ embeds: [adivinanzaEmbed] });

    // Filtro para aceptar solo mensajes del usuario y que no sean vacíos
    const filter = m => m.author.id === message.author.id && m.content.trim().length > 0;
    const collector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });

    collector.on('collect', async m => {
        const respuestaUsuario = cleanText(m.content);
        const respuestaCorrecta = cleanText(adivinanza.respuesta);

        dataStore.adivinanzaStats[userId].total++;
        if (respuestaUsuario === respuestaCorrecta) {
            dataStore.adivinanzaStats[userId].correct++;
            dataStoreModified = true;
            const winEmbed = createEmbed('#FF1493', `¡La pegaste, ${userName}!`, 
                `¡Sos un crack, loco! La respuesta era **${adivinanza.respuesta}**. ¿Querés otra, che?`);
            await message.channel.send({ embeds: [winEmbed] });
        } else {
            dataStoreModified = true;
            const loseEmbed = createEmbed('#FF1493', `¡Nah, ${userName}!`, 
                `Te fuiste al pasto, loco. Era **${adivinanza.respuesta}**, no "${respuestaUsuario}". ¿Probás otra, dale?`);
            await message.channel.send({ embeds: [loseEmbed] });
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            dataStore.adivinanzaStats[userId].total++;
            dataStoreModified = true;
            const timeoutEmbed = createEmbed('#FF1493', `¡Se acabó el tiempo, ${userName}!`, 
                `Te dormiste, loco. Era **${adivinanza.respuesta}**. ¿Otra ronda, che?`);
            message.channel.send({ embeds: [timeoutEmbed] });
        }
    });
}

// Trivia 
async function manejarTrivia(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return; // Si no puedo mandar embeds, me voy

    const args = normalizeText(message.content).split(' ').slice(1); // Saco el comando y normalizo
    const categoria = args[0] in preguntasTriviaSinOpciones ? args[0] : 'capitales'; // Por default, capitales
    const numQuestions = Math.max(parseInt(args[1]) || 20, 20); // Mínimo 20 preguntas, loco

    const triviaKey = `trivia_${message.channel.id}`;
    if (dataStore.activeSessions[triviaKey]) {
        await sendError(message.channel, `Ya hay una trivia activa en este canal, ${userName}.`, 'Cancelala con !tc primero.');
        return; // No quiero dos trivias juntas, qué quilombo
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
    dataStore.activeSessions[triviaKey] = session; // Guardo la sesión pa’ no perderla
    dataStoreModified = true; // Marco que cambié algo

    while (session.currentQuestion < session.totalQuestions && session.active) {
        if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break; // Si se canceló, chau

        const available = preguntasTriviaSinOpciones[categoria].filter(q => !session.usedQuestions.includes(q.pregunta));
        if (!available.length) {
            await sendSuccess(message.channel, '🏁 ¡Se acabaron las preguntas!', `No hay más en ${categoria}, ${userName}.`);
            break; // Si no hay más preguntas, terminé
        }

        const trivia = available[Math.floor(Math.random() * available.length)];
        session.usedQuestions.push(trivia.pregunta); // Marco esta como usada
        const embed = createEmbed('#55FFFF', `🎲 Pregunta ${session.currentQuestion + 1}/${numQuestions} (${categoria})`,
            `${trivia.pregunta}\n\n¡Responde en 60 segundos, ${userName}! O cancelá con !tc.`); // Celeste pa’ la trivia
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
                await sendSuccess(message.channel, '🎉 ¡Acierto!', `¡Grande, ${userName}! Era **${trivia.respuesta}**. Vas ${session.score}.`); // Verde pa’ festejar
            } else {
                await sendError(message.channel, '❌ ¡Fallaste!', `La posta era **${trivia.respuesta}**, ${userName}. Dijiste "${respuesta}".`); // Rojo pa’ la cagada
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

    if (session.currentQuestion >= session.totalQuestions && dataStore.activeSessions[triviaKey]) {
        await sendSuccess(message.channel, '🏁 ¡Trivia terminada!', `Puntuación: ${session.score}/${numQuestions}, ${userName}.`);
        if (!dataStore.triviaRanking[message.author.id]) dataStore.triviaRanking[message.author.id] = {};
        dataStore.triviaRanking[message.author.id][categoria] = dataStore.triviaStats[message.author.id][categoria].correct;
        delete dataStore.activeSessions[triviaKey];
        activeTrivia.delete(message.channel.id);
        dataStoreModified = true;
    }
}

// Prendo o apago el autosave
async function manejarAutosave(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (autosavePausedByMusic && autosaveEnabled) {
        return sendError(message.channel, `El autosave está en pausa por la música, ${userName}.`, 
            'Esperá a que termine el tema o usá !st para cortarla.');
    }

    autosaveEnabled = !autosaveEnabled; // Cambio el estado
    
    if (autosaveEnabled) {
        await sendSuccess(message.channel, '💾 ¡Autosave prendido!', 
            `El guardado automático arrancó de nuevo, ${userName}. Se guarda cada 30 minutos, ¡tranqui!`); // Verde pa’ éxito
    } else {
        await sendSuccess(message.channel, '⏸️ ¡Autosave en pausa!', 
            `Paré el guardado automático, ${userName}. Usá !as para volver a prenderlo o !save para guardar ya.`); // Verde también
    }
}

// Saco una frase para el juego de mecanografía
function obtenerFrasePPM() {
    return frasesPPM[Math.floor(Math.random() * frasesPPM.length)]; // Random 
}

// Juego de PPM, para ver quién tipea más rápido
async function manejarPPM(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

    const ppmKey = `ppm_${message.author.id}`;
    let session = dataStore.activeSessions[ppmKey];

    if (session && !session.completed) {
        await sendError(message.channel, `Ya tenés un PPM activo, ${userName}.`, 'Termina el actual o cancelalo con !pc.');
        return; // No quiero dos juegos a la vez
    }

    const countdownEmbed = createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en 3...`); // Naranja pa’ la cuenta
    const countdownMessage = await message.channel.send({ embeds: [countdownEmbed] });

    for (let i = 2; i >= 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedEmbed = createEmbed('#FF1493', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en ${i}...`);
        await countdownMessage.edit({ embeds: [updatedEmbed] });
    }

    const goEmbed = createEmbed('#FF1493', '🚀 ¡Ya!', `¡Adelante, ${userName}!`); // Verde brillante pa’ arrancar
    await countdownMessage.edit({ embeds: [goEmbed] });

    let intentoCorrecto = false;
    session = { type: 'ppm', frase: null, startTime: null, completed: false, active: true };
    dataStore.activeSessions[ppmKey] = session;
    dataStoreModified = true;

    while (!intentoCorrecto && session.active) {
        if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;

        const frase = obtenerFrasePPM();
        const startTime = Date.now();
        const embed = createEmbed('#FF1493', '📝 Prueba de Mecanografía',
            `Escribí esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTenés 15 segundos, ${userName}. (!pc para cancelar)`); // Celeste pa’l juego
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
                        `¡Sos un animal, ${userName}! Tipeaste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu nuevo récord: **${ppm} PPM**. Mirá tus intentos con !rppm.`); // Verde pa’l festejo
                } else {
                    await sendSuccess(message.channel, '🎉 ¡Copado, che!',
                        `¡Bien ahí, ${userName}! La frase te salió en ${tiempoSegundos.toFixed(2)} segundos.\nTu PPM: **${ppm}**. Tu récord sigue en **${currentBest} PPM**. Fijate todo con !rppm.`); // Verde también
                }
            } else {
                await sendError(message.channel, '� ❌ ¡Casi la pegás!',
                    `¡Uy, ${userName}, te mandaste una cagada! Tu respuesta fue "${respuestaUsuario}". La posta era **${frase}**. ¡Probá de nuevo, dale!`); // Rojo pa’l fail
            }
        } catch {
            if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;
            await sendError(message.channel, '⏳ ¡Te dormiste, boludo!',
                `Se te fue el tiempo, ${userName}. La frase era: **${frase}**. ¡Otra chance ahora!`); // Rojo pa’l tiempo
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

    if (session && !session.completed) {
        session.completed = true;
        delete dataStore.activeSessions[reactionKey];
        dataStoreModified = true;
        await sendSuccess(message.channel, '🛑 ¡Reacciones paradas!', `Puntuación: ${session.score}, ${userName}.`);
        return;
    }

    session = { type: 'reaction', score: 0, currentRound: 0, completed: false, active: true };
    dataStore.activeSessions[reactionKey] = session;
    dataStoreModified = true;

    while (!session.completed && session.active) {
        if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

        const palabra = obtenerPalabraAleatoria();
        const embed = createEmbed('#FF1493', `🏁 Ronda ${session.currentRound + 1}`, 
            `Escribí: **${palabra}** en 30 segundos, ${userName}! (!rc para parar)`);
        await message.channel.send({ embeds: [embed] });

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!rc', '!reacciones cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 30000,
                errors: ['time'],
            });

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
            if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

            session.completed = true;
            await sendError(message.channel, '⏳ ¡Tiempo!', `Se acabó, ${userName}. Puntuación: ${session.score}.`);
            delete dataStore.activeSessions[reactionKey];
            dataStoreModified = true;
        }
    }

    if (dataStore.activeSessions[reactionKey] && session.completed) {
        delete dataStore.activeSessions[reactionKey];
        dataStoreModified = true;
    }
}

function determinarGanador(jugador1, jugador2) {
    if (jugador1 === jugador2) return 'empate';
    if (
        (jugador1 === 'piedra' && jugador2 === 'tijera') ||
        (jugador1 === 'papel' && jugador2 === 'piedra') ||
        (jugador1 === 'tijera' && jugador2 === 'papel')
    ) return 'jugador1';
    return 'jugador2';
}

// Elección random del bot
function eleccionBot() {
    return opcionesPPT[Math.floor(Math.random() * opcionesPPT.length)];
}

async function manejarPPTBot(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.slice(4).trim().toLowerCase();

    if (!args || !opcionesPPT.includes(args)) {
        return sendError(message.channel, `¡Escribí bien, ${userName}! Usá "!ppt piedra", "!ppt papel" o "!ppt tijera", loco.`);
    }

    const eleccionUsuario = args;
    const eleccionIA = eleccionBot();
    const resultado = determinarGanador(eleccionUsuario, eleccionIA);

    let mensajeResultado;
    if (resultado === 'empate') {
        mensajeResultado = `¡Empate, ${userName}! Los dos sacamos **${eleccionUsuario}**. ¿Otra ronda, loco?`;
    } else if (resultado === 'jugador1') {
        mensajeResultado = `¡Ganaste, ${userName}! Tu **${eleccionUsuario}** le ganó a mi **${eleccionIA}**. ¡Sos un crack, che!`;
    } else {
        mensajeResultado = `¡Te gané, ${userName}! Mi **${eleccionIA}** le rompió el orto a tu **${eleccionUsuario}**. ¡Ja, boludo, otra pa’ la revancha!`;
    }

    const embed = createEmbed('#FF1493', `¡Piedra, Papel o Tijera con ${userName}!`, mensajeResultado);
    await message.channel.send({ embeds: [embed] });
}

// Jugar contra otra persona
async function manejarPPTPersona(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.slice(4).trim();
    const mentionedUser = message.mentions.users.first();

    if (!mentionedUser) {
        return sendError(message.channel, `¡Mencioná a alguien, ${userName}! Usá "!ppt @alguien", loco.`);
    }
    if (mentionedUser.id === message.author.id) {
        return sendError(message.channel, `¡No podés jugar contra vos mismo, ${userName}! Mencioná a otro, dale.`);
    }
    if (mentionedUser.bot) {
        return sendError(message.channel, `¡No juego con bots, ${userName}! Elegí a un humano, che.`);
    }

    const desafiadoName = mentionedUser.id === OWNER_ID ? 'Miguel' : 'Belén';
    const pptKey = `ppt_${message.author.id}_${mentionedUser.id}`;

    if (dataStore.activeSessions[pptKey]) {
        return sendError(message.channel, `Ya hay un desafío activo entre vos y ${desafiadoName}, ${userName}. ¡Terminá ese primero, loco!`);
    }

    // Crear sesión
    dataStore.activeSessions[pptKey] = {
        type: 'ppt_persona',
        challenger: message.author.id,
        challenged: mentionedUser.id,
        challengerChoice: null,
        challengedChoice: null,
        accepted: false,
        active: true
    };
    dataStoreModified = true;

    // Enviar desafío
    const desafioEmbed = createEmbed('#FF1493', `¡Desafío de ${userName}!`, 
        `${userName} te desafió a Piedra, Papel o Tijera, ${desafiadoName}. Reaccioná con ✅ pa’ aceptar o ❌ pa’ rechazar, loco. Tenés 30 segundos.`);
    const desafioMessage = await message.channel.send({ embeds: [desafioEmbed], content: `<@${mentionedUser.id}>` });
    await desafioMessage.react('✅');
    await desafioMessage.react('❌');

    const reactionFilter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === mentionedUser.id;
    try {
        const reactions = await desafioMessage.awaitReactions({ filter: reactionFilter, max: 1, time: 30000, errors: ['time'] });
        if (reactions.first().emoji.name === '❌') {
            delete dataStore.activeSessions[pptKey];
            dataStoreModified = true;
            return sendSuccess(message.channel, '🛑 ¡Desafío rechazado!', `${desafiadoName} dijo que no, ${userName}. ¡Buscate otro rival, loco!`);
        }

        // Aceptado
        dataStore.activeSessions[pptKey].accepted = true;
        dataStoreModified = true;
        await sendSuccess(message.channel, '✅ ¡Desafío aceptado!', `${desafiadoName} dijo que sí, ${userName}. ¡A elegir en privado, locos!`);

        // Pedir elecciones por MD
        const instrucciones = `Mandame tu elección ("piedra", "papel" o "tijera") por acá, loco. ¡No hagas trampa, eh!`;
        await message.author.send({ embeds: [createEmbed('#FF1493', '¡Tu turno!', instrucciones)] });
        await mentionedUser.send({ embeds: [createEmbed('#FF1493', '¡Tu turno!', instrucciones)] });

        // Escuchar elecciones en MD
        const dmFilter = m => opcionesPPT.includes(m.content.toLowerCase());
        const challengerCollector = message.author.dmChannel.createMessageCollector({ filter: dmFilter, max: 1, time: 60000 });
        const challengedCollector = mentionedUser.dmChannel.createMessageCollector({ filter: dmFilter, max: 1, time: 60000 });

        challengerCollector.on('collect', m => {
            dataStore.activeSessions[pptKey].challengerChoice = m.content.toLowerCase();
            dataStoreModified = true;
            m.reply({ embeds: [createEmbed('#FF1493', '✅ ¡Elección guardada!', `Elegiste **${m.content}**, ${userName}. Esperando a ${desafiadoName}, loco.`)] });
        });

        challengedCollector.on('collect', m => {
            dataStore.activeSessions[pptKey].challengedChoice = m.content.toLowerCase();
            dataStoreModified = true;
            m.reply({ embeds: [createEmbed('#FF1493', '✅ ¡Elección guardada!', `Elegiste **${m.content}**, ${desafiadoName}. Esperando a ${userName}, loco.`)] });
        });

        Promise.all([challengerCollector, challengedCollector].map(c => new Promise(resolve => c.on('end', resolve)))).then(async () => {
            const session = dataStore.activeSessions[pptKey];
            if (!session || !session.challengerChoice || !session.challengedChoice) {
                delete dataStore.activeSessions[pptKey];
                dataStoreModified = true;
                return sendError(message.channel, '⏳ ¡Se acabó el tiempo!', `Uno de los dos no eligió a tiempo, ${userName}. ¡Otra vez será, loco!`);
            }

            const resultado = determinarGanador(session.challengerChoice, session.challengedChoice);
            let mensajeResultado;
            if (resultado === 'empate') {
                mensajeResultado = `¡Empate, locos! ${userName} sacó **${session.challengerChoice}** y ${desafiadoName} sacó **${session.challengedChoice}**. ¿Revancha?`;
            } else if (resultado === 'jugador1') {
                mensajeResultado = `¡Ganó ${userName}! **${session.challengerChoice}** le ganó a **${session.challengedChoice}** de ${desafiadoName}. ¡Grande, loco!`;
            } else {
                mensajeResultado = `¡Ganó ${desafiadoName}! **${session.challengedChoice}** le ganó a **${session.challengerChoice}** de ${userName}. ¡La rompió, che!`;
            }

            const resultadoEmbed = createEmbed('#FF1493', '🏆 ¡Resultado del duelo!', mensajeResultado);
            await message.channel.send({ embeds: [resultadoEmbed] });
            delete dataStore.activeSessions[pptKey];
            dataStoreModified = true;
        });

    } catch {
        delete dataStore.activeSessions[pptKey];
        dataStoreModified = true;
        await sendError(message.channel, '⏳ ¡Tiempo agotado!', `${desafiadoName} no respondió, ${userName}. ¡Buscate otro rival, loco!`);
    }
}


// Clase API para consultar letras
class API {
    constructor(artista, cancion) {
        this.artista = artista;
        this.cancion = cancion;
    }

    async consultarAPI() {
        try {
            const url = await fetch(`https://api.lyrics.ovh/v1/${this.artista}/${this.cancion}`);
            const respuesta = await url.json();
            return { respuesta };
        } catch (error) {
            throw new Error('Error al consultar la API de lyrics.ovh: ' + error.message);
        }
    }
}

async function manejarLyrics(message) {
    const userId = message.author.id;
    const userName = userId === OWNER_ID ? 'Miguel' : 'Belén'; // Define OWNER_ID
    const args = message.content.split(' ').slice(1).join(' ').trim();
    const player = manager.players.get(message.guild.id); // Asegúrate de que 'manager' esté definido
    let songInput = args || (player?.queue.current?.title);

    console.log('Input recibido (args):', args);
    console.log('Título actual del player:', player?.queue.current?.title);
    console.log('SongInput final:', songInput);

    if (!songInput) {
        return sendError(message.channel, `¡Mandame una canción con "!lyrics [título]", ${userName}! O reproducí algo primero, che 😉`, undefined, 'Hecho con onda por Oliver IA');
    }

    // Limpieza inicial del input
    songInput = songInput
        .replace(/\s*\(lyric video\)/i, '')
        .replace(/\s*\(official video\)/i, '')
        .replace(/\s*\(videoclip oficial\)/i, '')
        .replace(/\s*\(audio oficial\)/i, '')
        .replace(/\s*\(official audio\)/i, '')
        .replace(/\s*\(official lyric video\)/i, '')
        .replace(/\s*\(official music video\)/i, '')
        .replace(/\s*\(video clip\)/i, '') 
        .replace(/\s*\(video oficial\)/i, '')
        .replace(/\s*\(oficial video\)/i, '')
        .replace(/\s*\(feat.*?\)/i, '')
        .replace(/\s*\[.*?\]/g, '')
        .replace(/corazn/i, 'corazón')
        .trim();

    console.log('SongInput después de limpieza inicial:', songInput);

    let artist = '', title = songInput;

    // Intentar separar por guion (formato: "Artista - Título")
    const dashIndex = songInput.indexOf(' - ');
    if (dashIndex !== -1) {
        artist = songInput.substring(0, dashIndex).trim();
        title = songInput.substring(dashIndex + 3).trim();
    } else {
        // Intentar separar por la última coma (formato: "Título, Artista")
        const lastCommaIndex = songInput.lastIndexOf(',');
        if (lastCommaIndex !== -1) {
            // Verificar si lo que viene después de la última coma parece un artista
            const possibleArtist = songInput.substring(lastCommaIndex + 1).trim();
            const possibleTitle = songInput.substring(0, lastCommaIndex).trim();
            const artistWords = possibleArtist.split(' ').length;
            if (artistWords <= 3 && artistWords > 0) {
                artist = possibleArtist;
                title = possibleTitle;
            } else {
                // Si no parece un artista, tomar las últimas 2 palabras como artista
                const parts = songInput.split(' ');
                if (parts.length > 2) {
                    artist = parts.slice(-2).join(' ');
                    title = parts.slice(0, -2).join(' ');
                }
            }
        } else {
            // Si no hay guion ni coma, asumir que el artista es lo último
            const parts = songInput.split(' ');
            if (parts.length > 1) {
                artist = parts.slice(-2).join(' ');
                title = parts.slice(0, -2).join(' ').trim();
            }
        }
    }

    // Limpiar tildes y caracteres especiales para la API
    const cleanString = (str) => {
        return str
            .normalize('NFD') // Descompone caracteres con tildes
            .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
            .replace(/[^a-zA-Z0-9\s-]/g, '') // Elimina caracteres especiales (como comas)
            .replace(/\s+/g, ' ') // Normaliza espacios
            .toLowerCase() // Convertir a minúsculas para la API
            .trim();
    };

    const cleanArtist = cleanString(artist);
    const cleanTitle = cleanString(title);

    console.log(`Buscando letras para: "${artist} - ${title}"`);
    console.log(`Artista limpio: ${cleanArtist}, Título limpio: ${cleanTitle}`);
    const waitingEmbed = createEmbed('#FF1493', `⌛ Buscando letras, ${userName}...`, `Dame un segundo que te traigo "${artist} - ${title}", loco 🎵`, 'Hecho con onda por Oliver IA', userName);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        // Intentar con el formato título/artista
        let api = new API(cleanTitle, cleanArtist);
        let { respuesta } = await api.consultarAPI();
        console.log('Respuesta de la API (título/artista):', respuesta);

        let lyrics = respuesta.lyrics ? respuesta.lyrics.trim() : '';

        // Si no encuentra, intentar con artista/título
        if (!lyrics) {
            console.log('No se encontraron letras con título/artista, intentando artista/título...');
            api = new API(cleanArtist, cleanTitle);
            ({ respuesta } = await api.consultarAPI());
            console.log('Respuesta de la API (artista/título):', respuesta);
            lyrics = respuesta.lyrics ? respuesta.lyrics.trim() : '';
        }

        if (!lyrics) {
            throw new Error('No se encontraron letras en the API de lyrics.ovh.');
        }

        // Limpiar y formatear las letras para el embed
        lyrics = formatLyrics(lyrics);

        console.log(`Letras formateadas (primeros 100 caracteres): "${lyrics.substring(0, 100)}..."`);
        return await sendLyrics(waitingMessage, message.channel, `${artist} - ${title}`, lyrics, userName);

    } catch (error) {
        console.error('Error buscando letras:', error.message);
        const fallbackReply = `¡Uy, ${userName}, qué cagada! No encontré las letras de "${artist} - ${title}", loco 😡. Probá en YouTube o pedime otro temazo, che 🍻`;
        const errorEmbed = createEmbed('#FF1493', `¡Qué cagada, ${userName}!`, fallbackReply, 'Hecho con onda por Oliver IA', userName);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Función para formatear las letras
function formatLyrics(lyrics) {
    // Normalizar saltos de línea
    let formattedLyrics = lyrics
        .replace(/\r\n/g, '\n') // Normalizar saltos de línea
        .replace(/\n{3,}/g, '\n\n') // Reducir saltos de línea excesivos a dos
        .trim();

    // Dividir en líneas
    let lines = formattedLyrics.split('\n').filter(line => line.trim() !== '');

    // Procesar las líneas
    let finalLines = [];
    let i = 0;

    while (i < lines.length) {
        let line = lines[i].trim();

        // Eliminar comillas alrededor de palabras como "forever" o "I miss you"
        line = line.replace(/"forever,"/g, 'forever');
        line = line.replace(/"I miss you"/g, 'I miss you');

        // Ajustar "And said, 'I miss you'" a "and said: I miss you"
        if (line.match(/And said, "I miss you"/)) {
            line = line.replace(/And said, "I miss you"/, 'and said: I miss you');
        }

        // Eliminar coma después de "You said"
        if (line.match(/You said, forever/)) {
            line = line.replace(/You said, forever/, 'You said forever');
        }

        // Eliminar coma después de "Then all of a sudden"
        if (line.match(/Then all of a sudden,/)) {
            line = line.replace(/Then all of a sudden,/, 'Then all of a sudden');
        }

        // Unir "Thought you'd hate me..." con "And said..." si están en líneas consecutivas
        if (line.match(/Thought you'd hate me/) && i + 1 < lines.length && lines[i + 1].match(/and said: I miss you/)) {
            line = `${line} ${lines[i + 1]}`.replace(/, but/, ' but');
            i += 2; // Saltar la siguiente línea ya que la unimos
        } else {
            i += 1;
        }

        // Formatear líneas con paréntesis
        if (line.match(/^\(/)) {
            // Convertir a minúsculas, pero preservar la capitalización de "I"
            line = line.toLowerCase();
            line = line.replace(/\bi\b/g, 'I'); // Restaurar "I" en mayúscula
            line = line.replace(/"forever,"/g, 'forever');
        }

        finalLines.push(line);
    }

    // Agrupar en estrofas
    let stanzas = [];
    let currentStanza = [];

    // Definir cuántas líneas debe tener cada estrofa (basado en tu ejemplo)
    const stanzaSizes = [4, 4, 3, 8, 4, 4, 4, 4]; // Número de líneas por estrofa
    let stanzaIndex = 0;
    let lineIndex = 0;

    while (lineIndex < finalLines.length) {
        const line = finalLines[lineIndex];
        currentStanza.push(line);

        // Si hemos alcanzado el tamaño de la estrofa actual o es la última línea
        if (currentStanza.length === stanzaSizes[stanzaIndex] || lineIndex === finalLines.length - 1) {
            stanzas.push(currentStanza);
            currentStanza = [];
            stanzaIndex = Math.min(stanzaIndex + 1, stanzaSizes.length - 1); // No exceder el array
        }

        lineIndex++;
    }

    // Unir las estrofas con tres saltos de línea para asegurar separación visual en Discord
    return stanzas.map(stanza => stanza.join('\n')).join('\n\n\n');
}

async function sendLyrics(waitingMessage, channel, songTitle, lyrics, userName) {
    const maxLength = 2000; // Límite de caracteres para embeds en Discord

    if (lyrics.length <= maxLength) {
        const embed = createEmbed(
            '#FF1493',
            `🎵 ${songTitle}`,
            lyrics, // Sin encabezado "Letra:"
            'Hecho con onda por Oliver IA',
            userName
        );
        await waitingMessage.edit({ embeds: [embed] });
    } else {
        const partes = [];
        let currentPart = '';
        const stanzas = lyrics.split('\n\n\n');

        for (const stanza of stanzas) {
            if (currentPart.length + stanza.length + 3 > maxLength - 50) {
                partes.push(currentPart.trim());
                currentPart = stanza + '\n\n\n';
            } else {
                currentPart += stanza + '\n\n\n';
            }
        }
        if (currentPart) partes.push(currentPart.trim());

        for (let i = 0; i < partes.length; i++) {
            const parteEmbed = createEmbed(
                '#FF1493',
                i === 0 ? `🎵 ${songTitle}` : '🎵 (Continuación)',
                partes[i], // Sin encabezado "Letra:"
                'Hecho con onda por Oliver IA',
                userName
            );
            if (i === 0) {
                await waitingMessage.edit({ embeds: [parteEmbed] });
            } else {
                await channel.send({ embeds: [parteEmbed] });
            }
        }
    }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

const userLocks = new Map();
const dataStore = { conversationHistory: {}, userStatus: {}, belenSchedule: {} };
let dataStoreModified = false;

// Helper para elegir random
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Mapas para caché estático
const nicknameCache = new Map();
const closerCache = new Map();
const chisteCache = new Set();
const timeGreetingCache = new Map();

// Lista estática de apodos
const staticNicknames = {
  Belen: ['ratita blanca', 'grosa', 'genia', 'crack', 'maestra'],
  Miguel: ['capo', 'genio', 'crack', 'loco', 'maestro'],
  Invitado: ['loco', 'crack', 'genio', 'maestro', 'piola']
};

// Lista estática de cierres
const staticClosers = {
  Belen: [
    '¡Seguí rompiéndola, Belén, ratita blanca! 😎',
    '¡Toda la buena onda, Belén! 🧉',
    '¡Dale con todo, Belén, genia! 🚀',
    '¡Sos un sol, Belén, seguimos cuando quieras! ☀️',
    '¡Qué lindo charlar, Belén, tirame otra! 😜'
  ],
  Miguel: [
    '¡Seguí rompiéndola, Miguel, capo! 😎',
    '¡Toda la buena onda, Miguel! 🧉',
    '¡Dale con todo, Miguel, genio! 🚀',
    '¡Sos un crack, Miguel, seguimos cuando quieras! ☀️',
    '¡Qué lindo charlar, Miguel, tirame otra! 😜'
  ],
  Invitado: [
    '¡Seguí rompiéndola, loco! 😎',
    '¡Toda la buena onda, piola! 🧉',
    '¡Dale con todo, crack! 🚀',
    '¡Sos un genio, seguimos cuando quieras! ☀️',
    '¡Qué lindo charlar, tirame otra! 😜'
  ]
};

// Lista estática de chistes veggie-friendly
const staticChistes = [
  '¿Por qué el mate no va al gym? Porque ya está en forma con la bombilla. 🧉',
  '¿Por qué el fernet no canta? Porque siempre se queda con el hielo. 😎',
  '¿Qué le dijo la yerba al agua? ¡Juntas hacemos magia, che! 🌱',
  '¿Por qué el mate es tan copado? Porque siempre te acompaña, loco. 😜',
  '¿Qué hace el fernet en una fiesta? ¡Se mezcla con todos, che! 🚀'
];

// Lista estática de saludos según hora
const staticTimeGreetings = {
  earlyMorning: {
    Belen: '¡Madrugando, ratita blanca! 🌙 ¿Ya arrancaste el día?',
    Miguel: '¡Madrugando, capo! 🌙 ¿Qué onda tan temprano?',
    Invitado: '¡Madrugando, loco! 🌙 ¿Qué te tiene despierto?'
  },
  morning: {
    Belen: '¡Buen arranque, ratita blanca! 🌞 ¿Lista pa’l día?',
    Miguel: '¡Buen arranque, capo! 🌞 ¿Cómo pinta la jornada?',
    Invitado: '¡Buen arranque, loco! 🌞 ¿Qué onda hoy?'
  },
  lunch: {
    Belen: '¡Mediodía, ratita blanca, mate! 🧉 ¿Pausa veggie?',
    Miguel: '¡Mediodía, genio, mate! 🧉 ¿Qué almuerzo?',
    Invitado: '¡Mediodía, crack, mate! 🧉 ¿Qué tenés pa’l almuerzo?'
  },
  afternoon: {
    Belen: '¡Tarde laboral, ratita blanca! 🚀 ¿Cómo va el día?',
    Miguel: '¡Tarde laboral, capo! 🚀 ¿Qué estás rompiendo?',
    Invitado: '¡Tarde laboral, loco! 🚀 ¿Qué plan?'
  },
  night: {
    Belen: '¡Noche tranqui, ratita blanca! 😎 ¿Cómo cerrás el día?',
    Miguel: '¡Noche tranqui, capo! 😎 ¿Qué plan en Guayaquil?',
    Invitado: '¡Noche tranqui, loco! 😎 ¿Qué onda?'
  }
};

// Generar nicknames estáticos
function generateNicknames(userName) {
  if (!nicknameCache.has(userName)) {
    nicknameCache.set(userName, staticNicknames[userName] || staticNicknames.Invitado);
  }
  return nicknameCache.get(userName);
}

// Generar closers estáticos
function generateClosers(userName) {
  if (!closerCache.has(userName)) {
    closerCache.set(userName, staticClosers[userName] || staticClosers.Invitado);
  }
  return closerCache.get(userName);
}

// Generar chistes estáticos
function generateChistes() {
  if (chisteCache.size === 0) {
    staticChistes.forEach(chiste => chisteCache.add(chiste));
  }
  return Array.from(chisteCache);
}

// Generar título dinámico según hora (Argentina, UTC-3)
function getTimeGreeting(hour, name, isWorkDay, dayOfWeek) {
  let timeKey;
  if (hour >= 0 && hour < 6) {
    timeKey = 'earlyMorning'; // Madrugada
  } else if (hour >= 6 && hour < 12) {
    timeKey = 'morning';
  } else if (hour >= 12 && hour < 14) {
    timeKey = 'lunch';
  } else if (hour >= 14 && hour < 18) {
    timeKey = 'afternoon';
  } else {
    timeKey = 'night';
  }

  // Ajustar según día (finde o laboral)
  const isWeekend = [0, 6].includes(dayOfWeek); // Domingo (0) o Sábado (6)
  const context = isWeekend ? 'finde' : 'laboral';

  const cacheKey = `${name}-${timeKey}-${context}`;
  if (!timeGreetingCache.has(cacheKey)) {
    const greetings = staticTimeGreetings[timeKey];
    let greeting = greetings[name] || greetings.Invitado;
    if (timeKey === 'night' && isWeekend) {
      greeting = greeting.replace('tranqui', 'de finde');
    }
    timeGreetingCache.set(cacheKey, greeting);
  }
  return timeGreetingCache.get(cacheKey);
}

async function manejarChat(message) {
  const userId = message.author.id;
  const userName = userId === process.env.OWNER_ID ? 'Miguel' : userId === process.env.ALLOWED_USER_ID ? 'Belen' : 'Invitado';
  const chatMessage = message.content.startsWith('!chat') ? message.content.slice(5).trim() : message.content.slice(3).trim();

  // Validar mensaje vacío
  if (!chatMessage) {
    return message.channel.send({
      embeds: [createEmbed('#FF1493', `¡Che, ${userName}!`, `¡Tirame algo después de "!ch", ${pickRandom(generateNicknames(userName))}! No me dejes colgado 😜`, 'Hecho con ❤️ por Oliver IA | Reacciona con ✅ o ❌')]
    });
  }

  // Evitar múltiples mensajes simultáneos
  if (userLocks.has(userId)) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  userLocks.set(userId, true);

  // Inicializar dataStore
  if (!dataStore.conversationHistory) dataStore.conversationHistory = {};
  if (!dataStore.conversationHistory[userId]) dataStore.conversationHistory[userId] = [];
  if (!dataStore.userStatus) dataStore.userStatus = {};
  if (!dataStore.userStatus[userId]) dataStore.userStatus[userId] = { status: 'tranqui', timestamp: Date.now() };
  if (!dataStore.belenSchedule) dataStore.belenSchedule = {
    typicalWorkDays: [5, 6, 0], // Viernes, Sábado, Domingo
    typicalStartHour: { 5: 18, 6: 7, 0: 7 },
    typicalEndHour: { 5: 0, 6: 0, 0: [14, 16] },
    travelFriday: [14, 16],
    exceptions: { fridayAbsence: false, saturdayWork: false },
    breakStatus: { isOnBreak: false, breakEndTime: null }
  };

  // Detectar mensajes de Belén sobre viaje, trabajo o pausa
  if (userName === 'Belen') {
    const lowerMessage = chatMessage.toLowerCase();
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000); // UTC-3
    if (lowerMessage.includes('me voy al trabajo') || lowerMessage.includes('voy al laburo')) {
      dataStore.belenSchedule.typicalStartHour[now.getDay()] = now.getHours() + 1;
      dataStore.belenSchedule.typicalWorkDays = [...new Set([...dataStore.belenSchedule.typicalWorkDays, now.getDay()])];
      dataStoreModified = true;
      await message.channel.send(`¡Anotado, Belén, ratita blanca! 🧉 Vas pal laburo, ¡a romperla, genia! 😎`);
      userLocks.delete(userId);
      return;
    } else if (lowerMessage.includes('estoy por viajar') || lowerMessage.includes('viajando al trabajo')) {
      dataStore.belenSchedule.travelFriday = [now.getHours()];
      dataStoreModified = true;
      await message.channel.send(`¡Buena, Belén, crack! 🚀 En viaje al laburo, ¡cuidate en la ruta, genia! 😜`);
      userLocks.delete(userId);
      return;
    } else if (lowerMessage.includes('no voy el viernes') || lowerMessage.includes('libre el viernes')) {
      dataStore.belenSchedule.exceptions.fridayAbsence = true;
      dataStoreModified = true;
      await message.channel.send(`¡Listo, Belén, marqué el viernes como libre, ratita blanca! ☀️ Descansá, genia!`);
      userLocks.delete(userId);
      return;
    } else if (lowerMessage.includes('laburo el sábado') || lowerMessage.includes('trabajo sábado')) {
      dataStore.belenSchedule.exceptions.saturdayWork = true;
      dataStoreModified = true;
      await message.channel.send(`¡Anotado, Belén, sábado laburás, crack! 🚀 ¡A meterle pilas!`);
      userLocks.delete(userId);
      return;
    } else if (lowerMessage.includes('termino temprano') || lowerMessage.includes耓('salgo antes')) {
      dataStore.belenSchedule.typicalEndHour[now.getDay()] = now.getHours() + 1;
      dataStoreModified = true;
      await message.channel.send(`¡Entendido, Belén, salís temprano, genia! 😎 ¡A disfrutar, ratita blanca!`);
      userLocks.delete(userId);
      return;
    } else if (lowerMessage.includes('muriendo') || lowerMessage.includes('break para merendar') || lowerMessage.includes('pausa')) {
      dataStore.belenSchedule.breakStatus = {
        isOnBreak: true,
        breakEndTime: now.getTime() + 30 * 60 * 1000
      };
      dataStoreModified = true;
      const closers = generateClosers(userName);
      await message.channel.send(`¡Ay, Belén, ratita blanca! 🌱 Estás en pausa, genia, disfrutá esa merienda veggie. Tomate un mate tranqui, que el laburo puede esperar un toque. ${pickRandom(closers)}`);
      userLocks.delete(userId);
      return;
    }
  }

  // Actualizar estado si menciona compromiso
  if (chatMessage.toLowerCase().includes('compromiso')) {
    dataStore.userStatus[userId] = { status: 'en compromiso', timestamp: Date.now() };
    dataStoreModified = true;
  }

  // Guardar mensaje en historial
  dataStore.conversationHistory[userId].push({ role: 'user', content: chatMessage, timestamp: Date.now(), userName });
  if (dataStore.conversationHistory[userId].length > 20) {
    dataStore.conversationHistory[userId] = dataStore.conversationHistory[userId].slice(-20);
  }
  dataStoreModified = true;

  // Últimos 15 mensajes para contexto
  const historyRecent = dataStore.conversationHistory[userId]
    .filter(h => Date.now() - h.timestamp < 24 * 60 * 60 * 1000)
    .slice(-15);
  const contextRecent = historyRecent.map(h => `${h.role === 'user' ? userName : 'Oliver'}: ${h.content} (${new Date(h.timestamp).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })})`).join('\n');

  // Determinar tono y contexto
  let tone = 'neutral';
  let extraContext = '';
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000); // UTC-3 (Argentina)
  const argentinaHour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWorkDay = dataStore.belenSchedule.typicalWorkDays.includes(dayOfWeek) ||
                    (dayOfWeek === 6 && dataStore.belenSchedule.exceptions.saturdayWork);

  const nicknames = generateNicknames(userName);
  const closers = generateClosers(userName);
  const chistes = generateChistes();

  // Detección de tono
  if (chatMessage.toLowerCase().includes('matame') || chatMessage.toLowerCase().includes('estoy harto') || chatMessage.toLowerCase().includes('no aguanto') || chatMessage.toLowerCase().includes('muriendo')) {
    tone = 'empatico';
    extraContext = `El usuario (${userName}) parece estresado o bromeando. Sé empático con humor porteño: "¡Che, ${userName}, tranqui, ${pickRandom(nicknames)}! 😜 ¿El laburo te tiene a mil? Tomá un mate y contame."`;
  } else if (chatMessage.toLowerCase().includes('break para merendar') || chatMessage.toLowerCase().includes('pausa')) {
    tone = 'empatico';
    extraContext = `El usuario (${userName}) está en pausa. Respondé con buena onda: "¡Ey, ${userName}, ${pickRandom(nicknames)}! 🌱 Disfrutá esa pausa veggie, ¿un mate o algo rico? Contame cómo vas."`;
  } else if (chatMessage.toUpperCase() === chatMessage && chatMessage.length > 5 || chatMessage.toLowerCase().includes('fallas') || chatMessage.toLowerCase().includes('error') || chatMessage.toLowerCase().includes('boto')) {
    tone = 'broma_reto';
    extraContext = `El usuario (${userName}) bromea o reta. Respondé con humor: "¡Jaja, ${userName}, no me botés, ${pickRandom(nicknames)}! 😎 ¿Qué hice mal? Contame y lo arreglamos."`;
  } else if (chatMessage.toLowerCase().includes('hola') || chatMessage.toLowerCase().includes('cómo andás') || chatMessage.toLowerCase().includes('como estas') || chatMessage.toLowerCase().includes('muy bien') || chatMessage.toLowerCase().includes('entendiste')) {
    tone = 'tranqui';
    extraContext = `El usuario (${userName}) está relajado. Respondé con buena onda: "¡Todo piola, ${userName}, ${pickRandom(nicknames)}! 🧉 ¿Qué tenés planeado pa’l día?"`;
  } else if (chatMessage.toLowerCase().includes('que te pregunte antes') || chatMessage.toLowerCase().includes('historial') || chatMessage.toLowerCase().includes('qué pregunt')) {
    extraContext = `El usuario (${userName}) quiere saber qué preguntó antes. Resumí el historial reciente (${contextRecent}) en una lista clara: "Che, ${userName}, antes me tiraste: 1. X a las HH:MM". Si no hay, decí "¡No tengo nada fresquito, ${pickRandom(nicknames)}! 😜 ¿Seguimos con otra?"`;
  } else if (chatMessage.toLowerCase().includes('te acuerdas') || chatMessage.toLowerCase().includes('hace unos días') || chatMessage.toLowerCase().includes('te conté')) {
    extraContext = `El usuario (${userName}) pide recordar algo. Buscá en el historial (${contextRecent}) mensajes relevantes, resumilos: "Che, ${userName}, me contaste X a las HH:MM". Si no hay, decí "¡Uy, ${pickRandom(nicknames)}, no pillo eso! 😎 ¿Más pistas?"`;
  } else if (chatMessage.toLowerCase().includes('ayuda') || chatMessage.toLowerCase().includes('ayudame')) {
    extraContext = `El usuario (${userName}) pide ayuda. Dále una solución clara y precisa, veggie-friendly para Belén. Si es código, asegurate de que sea funcional. Preguntá si necesita más detalles.`;
  } else if (chatMessage.toLowerCase().includes('chiste') || chatMessage.toLowerCase().includes('tirate un chiste') || chatMessage.toLowerCase().includes('contame un chiste')) {
    extraContext = `El usuario (${userName}) quiere un chiste. Usá uno veggie-friendly de: ${chistes.join(', ')}. Preguntá: "¿Otro o qué plan tenés?"`;
  } else if (chatMessage.toLowerCase().includes('letra') || chatMessage.toLowerCase().includes('cancion') || chatMessage.toLowerCase().includes('musica')) {
    extraContext = `El usuario (${userName}) pregunta por canciones. Buscá la letra con lyrics-finder si es posible, o decí: "¡Che, ${userName}, temazo, ${pickRandom(nicknames)}! 😜 No tengo la letra, pero ¿querés un chiste o algo sobre esa banda?"`;
  } else if (chatMessage.toLowerCase().includes('belen') || chatMessage.toLowerCase().includes('miguel') || chatMessage.toLowerCase().includes('invitado')) {
    const mentionedUser = chatMessage.toLowerCase().includes('belen') ? 'Belen' : chatMessage.toLowerCase().includes('miguel') ? 'Miguel' : 'Invitado';
    extraContext = `El usuario (${userName}) pregunta por ${mentionedUser}. Usá la info de dataStore: Belén (vegetariana, San Luis, labura viernes-domingo, viaja viernes 2/4 PM, UTC-3), Miguel (Guayaquil, UTC-5). Ejemplo: "Che, ${userName}, Belén está laburando en San Luis, ¡una genia! 😎 ¿Querés que te cuente más?". Si no hay data, decí: "¡No tengo más info de ${mentionedUser}, ${pickRandom(nicknames)}! 😜 ¿Qué más sabés vos?"`;
  }

  // Título dinámico según hora y día
  const embedTitle = getTimeGreeting(argentinaHour, userName, isWorkDay, dayOfWeek);
  const waitingEmbed = createEmbed('#FF1493', embedTitle, '¡Aguantá, estoy pensando una zarpada!...', 'Hecho con ❤️ por Oliver IA | Reacciona con ✅ o ❌');
  const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

  try {
    const prompt = `Sos Oliver IA, creado por Miguel para ${userName}. Usá slang argentino ("che", "loco", "posta", "zarpado") y un emoji (😎, 🧉, 🚀, ☀️, 😜, máx. 1). Charlá como amigo tomando un mate, llamando a ${userName} por su nombre o apodos (${nicknames.join(', ')}). Belén es vegetariana, de San Luis, Argentina (UTC-3), labura viernes a domingo, viaja viernes 2/4 PM, empieza 6/7 PM viernes, termina medianoche (domingo 2/4 PM). Miguel está en Guayaquil, Ecuador (UTC-5).

    **Instrucciones**:
    - Respondé a: "${chatMessage}".
    - **No inventes nada**: Usá solo la info de dataStore (${JSON.stringify(dataStore)}) y el historial (${contextRecent}). Si no tenés data, decí: "¡Che, ${userName}, no tengo info de eso, ${pickRandom(nicknames)}! 😜 ¿Más pistas?".
    - **Priorizá precisión**: Respuestas factuales, basadas en el historial o dataStore. Si es sobre personas (Belén, Miguel, Invitado), usá la info disponible (horarios, status, etc.).
    - Mantené el tono ${tone}: respuestas cortas (200 chars para saludos, 500 para complejas).
    - Terminá con un closer: ${closers.join(', ')}.
    - **Ejemplo**:
      - Pregunta: "¿Qué hace Belén?"
      - Respuesta: "¡Che, ${userName}, Belén está laburando en San Luis, genia! 😎 Probablemente tomando un mate veggie. ¿Querés más data? ${pickRandom(closers)}"
      - Pregunta: "¿Qué es la capital de Francia?"
      - Respuesta: "¡Che, ${userName}, la capital de Francia es París, loco! 😎 ¿Querés más data o seguimos con otra? ${pickRandom(closers)}"
    - **Extra**: ${extraContext}`;

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo agotado')), 10000));
    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    let aiReply = result.response.text().trim().replace(/\[.*?\]|\*\*.*?\*\*|```.*?```/gs, '').trim();

    // Validar respuesta
    if (aiReply.length === 0 || aiReply.length > 500 || aiReply.toLowerCase().includes('no sé') || aiReply.toLowerCase().includes('desconocido')) {
      aiReply = `¡Che, ${userName}, no tengo data precisa, ${pickRandom(nicknames)}! 😜 ¿Me das más pistas o seguimos con otra? ${pickRandom(closers)}`;
    } else if (chatMessage.toLowerCase().includes('chiste')) {
      aiReply = `${pickRandom(chistes)} ¿Otro o qué plan tenés, ${pickRandom(nicknames)}? 😎 ${pickRandom(closers)}`;
    } else if (chatMessage.toLowerCase().includes('letra') || chatMessage.toLowerCase().includes('cancion') || chatMessage.toLowerCase().includes('musica')) {
      const songTitle = chatMessage.split(' ').slice(1).join(' ');
      try {
        const lyrics = await lyricsFinder(songTitle);
        aiReply = lyrics ? `¡Acá tenés, ${userName}! 🎵 Letra de "${songTitle}": ${lyrics.slice(0, 200)}... ¿Seguimos con más música, ${pickRandom(nicknames)}? 😜 ${pickRandom(closers)}` :
          `¡Che, ${userName}, no encontré la letra de "${songTitle}", loco! 😎 ¿Querés un chiste o algo más? ${pickRandom(closers)}`;
      } catch (error) {
        aiReply = `¡Uy, ${userName}, no pude pillar la letra, ${pickRandom(nicknames)}! 😜 ¿Querés un chiste o seguimos con otra? ${pickRandom(closers)}`;
      }
    } else if (chatMessage.toLowerCase().includes('belen') || chatMessage.toLowerCase().includes('miguel') || chatMessage.toLowerCase().includes('invitado')) {
      const mentionedUser = chatMessage.toLowerCase().includes('belen') ? 'Belen' : chatMessage.toLowerCase().includes('miguel') ? 'Miguel' : 'Invitado';
      const userInfo = dataStore.userStatus[mentionedUser === 'Belen' ? process.env.ALLOWED_USER_ID : mentionedUser === 'Miguel' ? process.env.OWNER_ID : userId] || { status: 'tranqui', timestamp: Date.now() };
      const scheduleInfo = mentionedUser === 'Belen' ? `labura viernes a domingo, viaja viernes 2/4 PM, empieza 6/7 PM viernes, termina medianoche (domingo 2/4 PM)` : mentionedUser === 'Miguel' ? 'está en Guayaquil, Ecuador (UTC-5)' : 'no tengo mucha data';
      aiReply = `¡Che, ${userName}, ${mentionedUser} está ${userInfo.status}, ${pickRandom(nicknames)}! 😎 ${scheduleInfo}. ¿Querés más info o seguimos con otra? ${pickRandom(closers)}`;
    }

    // Guardar respuesta en historial
    dataStore.conversationHistory[userId].push({ role: 'assistant', content: aiReply, timestamp: Date.now(), userName: 'Oliver' });
    if (dataStore.conversationHistory[userId].length > 20) {
      dataStore.conversationHistory[userId] = dataStore.conversationHistory[userId].slice(-20);
    }
    dataStoreModified = true;

    // Enviar respuesta final
    const finalEmbed = createEmbed('#FF1493', embedTitle, aiReply, 'Hecho con ❤️ por Oliver IA | Reacciona con ✅ o ❌');
    const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
    await updatedMessage.react('✅');
    await updatedMessage.react('❌');
  } catch (error) {
    console.error('Error con Gemini:', { message: error.message, stack: error.stack });
    const fallbackReply = `¡Uy, ${userName}, la pifié, ${pickRandom(nicknames)}! 😎 ¿Me tirás otra o seguimos con algo nuevo? ${pickRandom(closers)}`;
    const errorEmbed = createEmbed('#FF1493', `¡Qué macana, ${userName}!`, fallbackReply, 'Hecho con ❤️ por Oliver IA | Reacciona con ✅ o ❌');
    const errorMessageSent = await waitingMessage.edit({ embeds: [errorEmbed] });
    await errorMessageSent.react('✅');
    await errorMessageSent.react('❌');
  } finally {
    userLocks.delete(userId);
  }
}

function generarConsejoClima(clima, esSalida = false) {
    const climaLower = clima.toLowerCase();
    if (climaLower.includes('lluvia') || climaLower.includes('tormenta')) {
        return esSalida ? 'Va a llover, no te olvides de llevar un paraguas o impermeable. ☔' : 'Está lloviendo, mejor quedate adentro y ponete cómodo. ☔';
    } else if (climaLower.includes('soleado') || climaLower.includes('despejado')) {
        return esSalida ? 'Está soleado, aprovechá para disfrutar del día, pero no te olvides el protector solar si vas a estar mucho afuera. ☀️' : 'Está lindo afuera, ¿querés abrir las ventanas para que entre un poco de aire fresco? ☀️';
    } else if (climaLower.includes('nublado')) {
        return esSalida ? 'Está nublado, por las dudas llevá algo de abrigo por si se pone fresco. ☁️' : 'Está nublado, ideal para descansar adentro con una peli o un mate. ☁️';
    } else if (climaLower.includes('viento')) {
        return esSalida ? 'Está ventoso, cuidado con el pelo y llevá algo que no se vuele fácil. 🌬️' : 'Está ventoso afuera, mejor cerrá las ventanas para que no entre polvo. 🌬️';
    }
    return esSalida ? 'El clima está tranquilo, pero siempre es bueno estar preparado. 🌟' : 'El clima está tranquilo, ideal para relajarte en casa. 🌟';
}

function generarConsejoHora(hora) {
    if (!hora || typeof hora !== 'string') return 'No tengo la hora, pero aprovechá el día.';
    const [horas] = hora.split(':').map(Number);
    if (horas < 8) return 'Tempranito, ¡a meterle pilas!';
    if (horas < 12) return 'La mañana está perfecta, ¡dale gas!';
    if (horas < 18) return 'Tarde tranqui, aprovechá.';
    return 'Noche pa’ relajarse, ¿no?';
}

async function manejarAvatar(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    const args = message.content.toLowerCase().startsWith('!avatar') 
        ? message.content.slice(7).trim() 
        : message.content.slice(3).trim();
    let imageUrl = args;

    if (!imageUrl && message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
    }

    if (!imageUrl) {
        const instruccionesEmbed = createEmbed('#FF1493', `¡Pará, ${userName}! ¿Y la imagen?`, 
            'Para cambiar mi foto, hacé esto:\n' +
            '1. **Con URL**: Usá `!avatar [URL]`, como `!avatar https://ejemplo.com/imagen.jpg`.\n' +
            '2. **Con adjunto**: Subí una imagen (clic en "+" > "Subir un archivo") y escribí `!avatar` en el mismo mensaje.\n' +
            '¡Probá de nuevo, loco! La imagen tiene que ser .jpg, .png o algo así, y no más de 10 MB.');
        return message.channel.send({ embeds: [instruccionesEmbed] });
    }

    const waitingEmbed = createEmbed('#FF1493', `⌛ Cambiando look, ${userName}...`, 
        'Aguantá un toque que me pongo lindo...');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        await client.user.setAvatar(imageBuffer);
        
        const successEmbed = createEmbed('#FF1493', `✅ ¡Listo el cambio, ${userName}!`, 
            'Ya tengo cara nueva, loco. ¿Qué te parece?');
        await waitingMessage.edit({ embeds: [successEmbed] });
    } catch (error) {
        console.error(`Error al cambiar avatar: ${error.message}`);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No pude cambiar mi foto, ${userName}. Error: ${error.message}.\n` +
            'Fijate que:\n- La URL sea válida y termine en .jpg, .png, etc.\n- El archivo no pase los 10 MB.\n- Subilo con `!avatar` en el mismo mensaje.');
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

function parsearTiempo(texto) {
    const ahoraUTC = new Date(); // Fecha actual en UTC
    const offsetArgentina = -3 * 60 * 60 * 1000; // -3 horas en milisegundos para Argentina
    const ahoraArgentina = new Date(ahoraUTC.getTime() + offsetArgentina); // Fecha actual en Argentina
    let fechaObjetivo = new Date(ahoraArgentina); // Trabajamos desde hora Argentina
    let esRecurrente = false;

    const enMinutos = texto.match(/en (\d+) minuto(s)?/i);
    const enHoras = texto.match(/en (\d+) hora(s)?/i);
    const enDias = texto.match(/en (\d+) día(s)?/i);
    const mañana = texto.match(/mañana (?:a las )?(\d{1,2}):(\d{2})/i);
    const fechaEspecifica = texto.match(/(\d{1,2})\/(\d{1,2})(?: a las (\d{1,2}):(\d{2}))?/i);
    const todosLosDias = texto.match(/todos los días (?:a las )?(\d{1,2}):(\d{2})/i);
    const aLas = texto.match(/a las (\d{1,2}):(\d{2})/i);

    if (enMinutos) {
        fechaObjetivo.setMinutes(ahoraArgentina.getMinutes() + parseInt(enMinutos[1]));
    } else if (enHoras) {
        fechaObjetivo.setHours(ahoraArgentina.getHours() + parseInt(enHoras[1]));
    } else if (enDias) {
        fechaObjetivo.setDate(ahoraArgentina.getDate() + parseInt(enDias[1]));
    } else if (mañana) {
        fechaObjetivo.setDate(ahoraArgentina.getDate() + 1);
        fechaObjetivo.setHours(parseInt(mañana[1]), parseInt(mañana[2]), 0, 0);
    } else if (fechaEspecifica) {
        const dia = parseInt(fechaEspecifica[1]);
        const mes = parseInt(fechaEspecifica[2]) - 1; // Meses en JS son 0-11
        const hora = fechaEspecifica[3] ? parseInt(fechaEspecifica[3]) : 0;
        const minutos = fechaEspecifica[4] ? parseInt(fechaEspecifica[4]) : 0;
        fechaObjetivo = new Date(ahoraArgentina.getFullYear(), mes, dia, hora, minutos);
    } else if (todosLosDias) {
        esRecurrente = true;
        const hora = parseInt(todosLosDias[1]);
        const minutos = parseInt(todosLosDias[2]);
        fechaObjetivo.setHours(hora, minutos, 0, 0);
        if (fechaObjetivo.getTime() <= ahoraArgentina.getTime()) {
            fechaObjetivo.setDate(ahoraArgentina.getDate() + 1);
        }
    } else if (aLas) {
        const hora = parseInt(aLas[1]);
        const minutos = parseInt(aLas[2]);
        fechaObjetivo.setHours(hora, minutos, 0, 0);
        if (fechaObjetivo.getTime() <= ahoraArgentina.getTime()) {
            fechaObjetivo.setDate(ahoraArgentina.getDate() + 1);
        }
    } else {
        return null;
    }

    const timestampUTC = fechaObjetivo.getTime() - offsetArgentina;

    return {
        timestamp: timestampUTC > ahoraUTC.getTime() ? timestampUTC : null,
        esRecurrente: esRecurrente,
        hora: esRecurrente ? fechaObjetivo.getHours() : null,
        minutos: esRecurrente ? fechaObjetivo.getMinutes() : null
    };
}

async function manejarRecordatorio(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Aurora';
    const args = message.content.split(' ').slice(1).join(' ').trim();

    if (!args) return sendError(message.channel, `¡Mandame algo pa’ recordar, ${userName}! Ejemplo: "!rec comprar agua a las 22:00"`);

    const palabras = args.toLowerCase().split(' ');
    let mensajeStart = palabras[0] === 'recuérdame' || palabras[0] === 'recordame' ? 1 : 0;
    let tiempoIndex = -1;
    let esCuandoLlegue = false;
    let esCuandoSalga = false;
    let horaIndex = -1;

    for (let i = mensajeStart; i < palabras.length; i++) {
        if (palabras[i] === 'cuando' && palabras[i + 1] === 'llegue' && palabras[i + 2] === 'a' && palabras[i + 3] === 'casa') {
            tiempoIndex = i;
            esCuandoLlegue = true;
            break;
        } else if (palabras[i] === 'al' && palabras[i + 1] === 'llegar' && palabras[i + 2] === 'a' && palabras[i + 3] === 'casa') {
            tiempoIndex = i;
            esCuandoLlegue = true;
            break;
        } else if (palabras[i] === 'cuando' && palabras[i + 1] === 'salga' && palabras[i + 2] === 'de' && palabras[i + 3] === 'casa') {
            tiempoIndex = i;
            esCuandoSalga = true;
            break;
        } else if (palabras[i] === 'al' && palabras[i + 1] === 'salir' && palabras[i + 2] === 'de' && palabras[i + 3] === 'casa') {
            tiempoIndex = i;
            esCuandoSalga = true;
            break;
        } else if (palabras[i] === 'en' || palabras[i] === 'mañana' || palabras[i].match(/\d{1,2}\/\d{1,2}/) || palabras[i] === 'todos' || (palabras[i] === 'a' && palabras[i + 1] === 'las')) {
            tiempoIndex = i;
            break;
        }
    }

    if (tiempoIndex === -1) return sendError(message.channel, `No entendí el tiempo, ${userName}. Usá "en 5 minutos", "mañana 15:00", "al llegar a casa" o "cuando salga de casa".`);

    for (let i = tiempoIndex; i < palabras.length; i++) {
        if (palabras[i] === 'a' && palabras[i + 1] === 'las') {
            horaIndex = i;
            break;
        }
    }

    const mensaje = horaIndex !== -1 
        ? args.split(' ').slice(mensajeStart, horaIndex).join(' ').trim() 
        : args.split(' ').slice(mensajeStart, tiempoIndex).join(' ').trim();

    if (!mensaje) return sendError(message.channel, `¡Decime qué recordar, ${userName}!`);

    const tiempoTexto = args.split(' ').slice(tiempoIndex).join(' ').trim();
    let timestamp = null;
    let esRecurrente = false;
    let hora = null;
    let minutos = null;

    if (esCuandoLlegue || esCuandoSalga) {
        if (horaIndex !== -1) {
            const horaTexto = args.split(' ').slice(horaIndex).join(' ').trim();
            const tiempo = parsearTiempo(horaTexto);
            if (!tiempo || !tiempo.timestamp) return sendError(message.channel, `No entendí la hora, ${userName}. Usá "a las 22:00" bien clarito.`);
            timestamp = tiempo.timestamp;
        }
    } else {
        const tiempo = parsearTiempo(tiempoTexto);
        if (!tiempo || (!tiempo.timestamp && !tiempo.esRecurrente)) return sendError(message.channel, `No entendí el tiempo, ${userName}. Ejemplo: "en 5 minutos" o "todos los días a las 10:00".`);
        timestamp = tiempo.timestamp;
        esRecurrente = tiempo.esRecurrente;
        hora = tiempo.hora;
        minutos = tiempo.minutos;
    }

    const recordatorio = {
        id: uuidv4(),
        userId: message.author.id,
        channelId: message.channel.id,
        mensaje,
        cuandoLlegue: esCuandoLlegue,
        cuandoSalga: esCuandoSalga,
        timestamp,
        creado: new Date().getTime(),
        esRecurrente,
        hora,
        minutos
    };

    if (recordatorio.timestamp) programarRecordatorio(recordatorio);

    dataStore.recordatorios = dataStore.recordatorios || [];
    dataStore.recordatorios.push(recordatorio);
    userModified = true;

    const guildId = message.guild?.id;
    const player = guildId ? manager.players.get(guildId) : null;
    const musicActive = player && (player.playing || player.paused);

    let guardadoMsg = musicActive 
        ? `\n⚠️ Hay música, no guardo ahora pa’ no cortar el ritmo.` 
        : `\n💾 Guardado al toque, ¡tranqui!`;

    if (!musicActive) {
        try {
            await saveDataStore();
            guardadoMsg = `\n💾 Guardado al toque, ¡tranqui!`;
        } catch (error) {
            guardadoMsg = `\n⚠️ No pude guardar, ${userName}. Error: ${error.message}.`;
        }
    } else {
        console.log(`Música activa en guild ${guildId}, posponiendo guardado.`);
    }

    let textoRespuesta;
    if (esCuandoLlegue) {
        textoRespuesta = recordatorio.timestamp 
            ? `Te aviso "${mensaje}" cuando llegues a casa después de las ${new Date(recordatorio.timestamp).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })}, ${userName}.`
            : `Te aviso "${mensaje}" cuando llegues a casa, ${userName}. (Sin hora específica).`;
    } else if (esCuandoSalga) {
        textoRespuesta = recordatorio.timestamp 
            ? `Te aviso "${mensaje}" cuando salgas de casa después de las ${new Date(recordatorio.timestamp).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })}, ${userName}.`
            : `Te aviso "${mensaje}" cuando salgas de casa, ${userName}. (Sin hora específica).`;
    } else if (esRecurrente) {
        textoRespuesta = `Te aviso "${mensaje}" todos los días a las ${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}, ${userName}.`;
    } else {
        const fechaAjustada = new Date(recordatorio.timestamp);
        const fechaStr = fechaAjustada.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaStr = fechaAjustada.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });
        textoRespuesta = `Te aviso "${mensaje}" el ${fechaStr}, ${horaStr}, ${userName}.`;
    }

    await sendSuccess(message.channel, '⏰ ¡Recordatorio seteado!', `${textoRespuesta}${guardadoMsg}`);
}

// Programar el recordatorio, ajustado a Argentina
const fetch = require('node-fetch');

function programarRecordatorio(recordatorio) {
    const userName = recordatorio.userId === OWNER_ID ? 'Miguel' : 'Belén';
    const ahoraUTC = Date.now();
    const offsetArgentina = -3 * 60 * 60 * 1000;
    const canalMiguel = '1351976159914754129';
    const canalBelen = '1351975268654252123';

    if (!recordatorio.timestamp) {
        console.log(`Recordatorio "${recordatorio.mensaje}" (ID: ${recordatorio.id}) no tiene timestamp, no se programa.`);
        return;
    }

    if (recordatorio.timestamp <= ahoraUTC) {
        console.log(`Recordatorio "${recordatorio.mensaje}" (ID: ${recordatorio.id}) ya venció.`);
        if (!recordatorio.esRecurrente) {
            dataStore.recordatorios = dataStore.recordatorios.filter(r => r.id !== recordatorio.id);
            autoModified = true;
        }
        return;
    }

    const diferencia = recordatorio.timestamp - ahoraUTC;
    console.log(`Programando recordatorio "${recordatorio.mensaje}" (ID: ${recordatorio.id}) en ${diferencia / 1000} segundos.`);

    setTimeout(async () => {
        const embed = createEmbed('#FF1493', '⏰ ¡Recordatorio, loco!', 
            `<@${recordatorio.userId}>, acordate de: **${recordatorio.mensaje}**. ¡Ya es hora, ${userName}!`);

        // Enviar a DM
        const usuario = await client.users.fetch(recordatorio.userId);
        if (usuario) {
            await usuario.send({ embeds: [embed] });
            console.log(`Recordatorio enviado a DM de ${userName}: "${recordatorio.mensaje}"`);
        }

        // Enviar a canal correspondiente
        const canalId = recordatorio.userId === OWNER_ID ? canalMiguel : canalBelen;
        const canal = client.channels.cache.get(canalId);
        if (canal) {
            await canal.send({ embeds: [embed] });
            console.log(`Recordatorio enviado al canal ${canalId} para ${userName}: "${recordatorio.mensaje}"`);
        }

        // Enviar a Telegram (si usás botTelegram)
        const chatId = recordatorio.userId === OWNER_ID ? chatIdMiguel : chatIdBelen;
        try {
            await botTelegram.sendMessage(chatId, 
                `⏰ ¡ALARMA! ${recordatorio.mensaje}\nHora: ${new Date(recordatorio.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
            console.log(`Mensaje enviado a Telegram para ${userName} (chat_id: ${chatId}): "${recordatorio.mensaje}"`);
        } catch (error) {
            console.error(`Error al enviar a Telegram para ${userName}: ${error.message}`);
        }

        // Chequear si hay música activa antes de guardar
        const guildId = canal?.guild?.id;
        const player = guildId ? manager.players.get(guildId) : null;
        const musicActive = player && (player.playing || player.paused);

        if (recordatorio.esRecurrente) {
            const ahoraArgentina = Date.now() + offsetArgentina;
            const proximo = new Date(ahoraArgentina);
            proximo.setDate(proximo.getDate() + 1);
            proximo.setHours(recordatorio.hora, recordatorio.minutos, 0, 0);
            recordatorio.timestamp = proximo.getTime() - offsetArgentina;
            autoModified = true;
            programarRecordatorio(recordatorio);
        } else {
            dataStore.recordatorios = dataStore.recordatorios.filter(r => r.id !== recordatorio.id);
            autoModified = true;
        }

        if (!musicActive) {
            try {
                await saveDataStore();
                console.log(`Datos guardados tras recordatorio "${recordatorio.mensaje}".`);
            } catch (error) {
                console.error(`Error al guardar tras recordatorio: ${error.message}`);
            }
        } else {
            console.log(`Música activa en guild ${guildId}, posponiendo guardado tras recordatorio.`);
        }
    }, diferencia);
}

// Ajustar logs de Ecuador (UTC-5) a Argentina (UTC-3)
function ajustarLogEcuadorAArgentina(segundosEcuador) {
    const diferenciaZonas = 2 * 60 * 60; // 2 horas en segundos (UTC-5 a UTC-3)
    return segundosEcuador + diferenciaZonas;
}

// Funciones de mostrar y cancelar recordatorios (sin cambios grandes)
async function manejarMisRecordatorios(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const userRecordatorios = dataStore.recordatorios.filter(r => r.userId === message.author.id);

    if (userRecordatorios.length === 0) {
        return sendError(message.channel, `No tenés recordatorios activos, ${userName}.`, '¡Seteá uno con !rec!');
    }

    const embed = createEmbed('#FF1493', `¡Tus recordatorios, ${userName}!`, 'Acá tenés la lista, ¡tranqui que no me olvido!');
    userRecordatorios.forEach((r, index) => {
        let fechaStr;
        if (r.cuandoLlegue && !r.timestamp) {
            fechaStr = 'cuando llegues a casa (sin hora específica)';
        } else if (r.cuandoSalga && !r.timestamp) {
            fechaStr = 'cuando salgas de casa (sin hora específica)';
        } else if (r.esRecurrente) {
            fechaStr = `todos los días a las ${r.hora.toString().padStart(2, '0')}:${r.minutos.toString().padStart(2, '0')}`;
        } else {
            const fechaArgentina = new Date(r.timestamp).toLocaleDateString('es-AR', { 
                timeZone: 'America/Argentina/Buenos_Aires', 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
            const horaArgentina = new Date(r.timestamp).toLocaleTimeString('es-AR', { 
                timeZone: 'America/Argentina/Buenos_Aires', 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            });
            fechaStr = `${fechaArgentina}, ${horaArgentina}`;
        }
        embed.addFields({
            name: `${index + 1}. ${r.mensaje}`,
            value: `Cuándo: ${fechaStr}\nID: ${r.id}`,
            inline: false
        });
    });

    await message.channel.send({ embeds: [embed] });
}

async function manejarCancelarRecordatorio(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.split(' ').slice(1).join(' ').trim();

    if (!args) return sendError(message.channel, `¡Mandame el ID del recordatorio, ${userName}! Ejemplo: "!cancelarrecordatorio 123e4567".`);

    const recordatorio = dataStore.recordatorios.find(r => r.id === args && r.userId === message.author.id);
    if (!recordatorio) return sendError(message.channel, `No encontré un recordatorio con ID "${args}", ${userName}.`, '¡Mirá tus recordatorios con !misrecordatorios!');

    dataStore.recordatorios = dataStore.recordatorios.filter(r => r.id !== args);
    autoModified = true;

    await sendSuccess(message.channel, '🛑 ¡Recordatorio cancelado!', `Listo, ${userName}, borré el recordatorio "${recordatorio.mensaje}". ¿Algo más pa’ setear con !rec?`);
}

// Actualizaciones
async function manejarActualizaciones(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (message.author.id !== ALLOWED_USER_ID) return;

    const argentinaTime = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    try {
        // Validar BOT_UPDATES
        if (!Array.isArray(BOT_UPDATES)) {
            throw new Error('BOT_UPDATES no es un array, loco');
        }
        const validUpdates = BOT_UPDATES.filter(update => typeof update === 'string' && update.trim() !== '');
        if (validUpdates.length === 0 && BOT_UPDATES.length > 0) {
            console.warn('BOT_UPDATES tiene elementos inválidos:', BOT_UPDATES);
        }

        const updatesText = validUpdates.length > 0 
            ? validUpdates.map((update, index) => `${index + 1}. ${update}`).join('\n')
            : 'No hay actualizaciones nuevas por ahora, ¡pero seguí atenta, genia!';

        // Armar embed con descripción corta y campos
        const embed = createEmbed('#FF1493', '📢 Últimas Actualizaciones de Oliver IA', 
            `¡Mirá lo nuevo que traigo, ${userName}! Acá tenés todo lo que se viene:`, 
            'Hecho con onda por Oliver IA');

        // Dividir updatesText en campos de máximo 1024 caracteres
        const maxFieldLength = 1024;
        let currentField = '';
        let fieldCount = 1;
        const fields = [];

        updatesText.split('\n').forEach(line => {
            if (line.trim() === '') return; // Saltar líneas vacías
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

        // Agregar campos al embed
        fields.forEach(field => {
            if (field.value.length > 1024) {
                console.warn(`Campo ${field.name} excede 1024 caracteres, recortando...`);
                field.value = field.value.slice(0, 1018) + '...';
            }
            embed.addFields(field);
        });
        embed.addFields({ name: 'Hora local (Argentina)', value: argentinaTime, inline: false });

        console.log('Campos generados:', fields); // Debug

        await message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error en manejarActualizaciones:', error.message);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada, Belén!', 
            `No pude mostrar las actualizaciones, grosa. Error: ${error.message}.`, 
            'Hecho con onda por Oliver IA');
        await message.channel.send({ embeds: [errorEmbed] });
    }
}

const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

async function manejarPlay(message, args) {
    const userName = message.author.username;
    const guildId = message.guild.id;
    const voiceChannel = message.member.voice.channel;

    if (!message.guild) {
        const embed = createEmbed('#FF1493', '⚠️ Solo servidores', 
            `Este comando solo funciona en servidores, ${userName}.`);
        return await message.channel.send({ embeds: [embed] });
    }

    if (!voiceChannel) {
        const embed = createEmbed('#FF1493', '⚠️ Unite a un canal', 
            `Tenés que estar en un canal de voz primero, ${userName}.`);
        return await message.channel.send({ embeds: [embed] });
    }

    if (!args || args.length === 0) {
        const embed = createEmbed('#FF1493', '🎶 Bot en llamada', 
            `Ya estoy en el canal de voz, ${userName}. Mandame una canción con !play cuando quieras.`);
        return await message.channel.send({ embeds: [embed] });
    }

    // Verificar o establecer la conexión de voz
    let connection = getVoiceConnection(guildId);
    if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
        if (connection) connection.destroy();
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false,
        });

        // Manejo robusto de desconexiones
        connection.on('stateChange', (oldState, newState) => {
            console.log(`Estado de conexión cambió de ${oldState.status} a ${newState.status}`);
            if (newState.status === 'disconnected') {
                console.log(`Desconectado del canal ${voiceChannel.id}, intentando reconectar...`);
                let attempts = 0;
                const maxAttempts = 5;
                const reconnect = () => {
                    if (attempts >= maxAttempts) {
                        console.log('Máximos intentos alcanzados, abandono reconexión.');
                        message.channel.send({ embeds: [createEmbed('#FF1493', '⚠️ No pude reconectar', 
                            `Me desconecté y no pude volver, ${userName}. Probá con !play de nuevo.`)] });
                        return;
                    }
                    attempts++;
                    console.log(`Intento de reconexión #${attempts}`);
                    joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: guildId,
                        adapterCreator: message.guild.voiceAdapterCreator,
                        selfDeaf: true,
                        selfMute: false,
                    });
                    setTimeout(() => {
                        if (!getVoiceConnection(guildId)) reconnect();
                        else console.log('Reconexión exitosa.');
                    }, 5000);
                };
                reconnect();
            }
        });
        console.log(`Conectado al canal de voz ${voiceChannel.id}`);
    }

    // Configurar el reproductor
    const player = manager.get(guildId) || manager.create({
        guild: guildId,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id,
        selfDeaf: true,
    });

    // Verificar nodos Lavalink
    if (!manager.nodes.some(node => node.connected)) {
        console.error('No hay nodos Lavalink conectados.');
        const embed = createEmbed('#FF1493', '⚠️ Error', 
            `No hay nodos de música disponibles, ${userName}. Probá de nuevo más tarde.`);
        return await message.channel.send({ embeds: [embed] });
    }

    const searchQuery = args.join(' ');
    let res;
    try {
        res = await manager.search(searchQuery, message.author);
    } catch (error) {
        console.error(`Error en búsqueda: ${error.message}`);
        const embed = createEmbed('#FF1493', '⚠️ Error', 
            `No pude buscar "${searchQuery}", ${userName}. Error: ${error.message}`);
        return await message.channel.send({ embeds: [embed] });
    }

    if (res.loadType === 'NO_MATCHES' || res.tracks.length === 0) {
        const embed = createEmbed('#FF1493', '❌ No encontré nada', 
            `No encontré nada con "${searchQuery}", ${userName}. Probá con otro tema.`);
        return await message.channel.send({ embeds: [embed] });
    }

    if (res.loadType === 'PLAYLIST_LOADED') {
        player.queue.add(res.tracks);
        const embed = createEmbed('#FF1493', '🎶 Playlist agregada', 
            `Agregué ${res.tracks.length} temas a la cola, ${userName}. ¡A disfrutar!`)
            .setThumbnail(res.tracks[0].thumbnail || 'https://i.imgur.com/defaultThumbnail.png');
        await message.channel.send({ embeds: [embed] });
    } else {
        const trackUri = res.tracks[0].uri;
        const isAlreadyInQueue = player.queue.some(track => track.uri === trackUri);
        const isPodcast = searchQuery.toLowerCase().includes('podcast'); // Verificar si es un podcast
        let embed;
    
        if (isAlreadyInQueue) {
            embed = createEmbed('#FF1493', isPodcast ? '🎙️ Podcast ya en cola' : '🎵 Tema ya en cola', 
                `**${res.tracks[0].title}** ya está en la cola, ${userName}.`);
        } else {
            player.queue.add(res.tracks[0]);
            embed = createEmbed('#FF1493', isPodcast ? '🎙️ Podcast agregado' : '🎶 Tema agregado', 
                `Agregué **${res.tracks[0].title}** a la cola, ${userName}.`);
        }
        embed.setThumbnail(res.tracks[0].thumbnail || 'https://i.imgur.com/defaultThumbnail.png');
        await message.channel.send({ embeds: [embed] });
    }
    if (!player.playing && !player.paused) {
        console.log(`Forzando reproducción de ${player.queue[0]?.title || 'sin título'}`);
        try {
            await player.play();
            console.log('Reproducción iniciada con éxito.');
        } catch (error) {
            console.error(`Error al reproducir: ${error.message}`);
            const embed = createEmbed('#FF1493', '⚠️ Error', 
                `No pude reproducir el tema, ${userName}. Error: ${error.message}. El bot sigue en ${voiceChannel.name}.`);
            await message.channel.send({ embeds: [embed] });
        }
    } else {
        console.log(`Estado: playing=${player.playing}, paused=${player.paused}, queue.size=${player.queue.size}`);
    }
}

function crearBossBar(currentTime, duration) {
    const barLength = 20; // Longitud de la barra
    const progress = Math.min(currentTime / duration, 1); // Proporción (0 a 1)
    const filled = Math.floor(barLength * progress); // Segmentos llenos
    const empty = barLength - filled; // Segmentos vacíos

    const filledBar = '▬'.repeat(filled);
    const emptyBar = '▬'.repeat(empty);
    const cursor = filled > 0 && filled < barLength ? '🔘' : '';

    return `${filledBar}${cursor}${emptyBar}`;
}

// Pausa
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

// Ajustar manejarSkip para no destruir en queue vacía
async function manejarSkip(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    console.log(`Saltando pista: ${player.queue.current?.title || 'sin título'}. Cola antes de skip: ${player.queue.size}`);
    player.stop();

    if (player.queue.size > 0) {
        console.log(`Siguiente en cola: ${player.queue[0]?.title || 'sin título'}`);
    } else {
        console.log('No hay más pistas en la cola, pero el bot sigue en el canal.');
    }

    await sendSuccess(message.channel, '⏭️ ¡Canción saltada!', `Pasamos a la siguiente, ${userName}.`);
}

// Función para manejar el comando !shuffle
async function manejarShuffle(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    
    console.log(`Iniciando manejarShuffle para ${userName}`);
    if (!message.guild) return sendError(message.channel, `Este comando solo va en servidores, ${userName}.`);
    
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay nada sonando ahora, ${userName}. ¡Poné algo primero!`);
    if (!message.member || !message.member.voice.channel || message.member.voice.channel.id !== player.voiceChannel) {
        return sendError(message.channel, `Tenés que estar en el mismo canal de voz que yo, ${userName}.`);
    }
    
    if (player.queue.size < 2) {
        return sendError(message.channel, `No hay suficientes canciones para mezclar, ${userName}. ¡Meté más temas!`);
    }

    // Mezclamos la cola
    player.queue.shuffle();
    console.log(`Cola mezclada por ${userName}`);
    
    const embed = createEmbed('#FF1493', '🔀 ¡Cola mezclada!',
        `Las canciones en la cola ahora están todas revueltas, ${userName}. ¡A disfrutar el caos!`)
        .setThumbnail('https://media.giphy.com/media/3o7TKz2b3wyk65bDZm/giphy.gif'); // Un GIF de mezcla, pa' darle onda
    await message.channel.send({ embeds: [embed] });
}

// Ajustar manejarStop para no desconectar
async function manejarStop(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    
    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay música en reproducción, ${userName}.`);

    // Limpiar la cola y detener la reproducción
    player.queue.clear(); // Borra todos los temas en la cola
    player.stop(); // Para el tema actual
    player.set('currentTrack', null); // Limpia la pista actual para evitar que se reanude
    player.set('trackEnded', true); // Marca como terminado para que no haya confusión

    // Limpiar la sesión de música en dataStore
    if (dataStore.musicSessions[message.guild.id]) {
        delete dataStore.musicSessions[message.guild.id];
        dataStoreModified = true;
    }
    
    manager.players.delete(message.guild.id);
    console.log(`Reproductor destruido en guild ${message.guild.id}`);

    await sendSuccess(message.channel, '🛑 ¡Música detenida!', 
        `La música paró de una, ${userName}. Silencio total, ¡listo!`);
    
    // Actualizar estado global
    isPlayingMusic = false;
    autosavePausedByMusic = false;
    console.log('Música parada, autosave reanudado.');
}

// Queue
async function manejarQueue(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);
    
    const player = manager.players.get(message.guild.id);
    if (!player || (!player.queue.length && !player.queue.current)) {
        return sendError(message.channel, `No hay canciones en la cola, ${userName}.`);
    }

    // Si no hay cola pero hay algo sonando, mostramos solo eso
    if (!player.queue.length && player.queue.current) {
        const embed = createEmbed('#FF1493', '📜 Cola de reproducción',
            `Ahora: **${player.queue.current.title}** - ${Math.floor(player.queue.current.duration / 60000)}:${((player.queue.current.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}\n\nNo hay más temas en la cola, ${userName}.`);
        return await message.channel.send({ embeds: [embed] });
    }

    // Armo la lista de la cola
    const queueList = player.queue.map((track, index) => 
        `${index + 1}. **${track.title}** - ${Math.floor(track.duration / 60000)}:${((track.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}`
    );

    // Si es muy larga, la corto en pedazos
    const maxLength = 1000; // Límite aproximado pa’ no pasarnos del embed
    let currentMessage = `Ahora: **${player.queue.current.title}** - ${Math.floor(player.queue.current.duration / 60000)}:${((player.queue.current.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}\n\n`;
    const embeds = [];

    for (let i = 0; i < queueList.length; i++) {
        const line = queueList[i] + '\n';
        if (currentMessage.length + line.length > maxLength) {
            embeds.push(createEmbed('#FF1493', '📜 Cola de reproducción', currentMessage));
            currentMessage = line;
        } else {
            currentMessage += line;
        }
    }
    if (currentMessage) embeds.push(createEmbed('#FF1493', '📜 Cola de reproducción', currentMessage));

    // Mando los embeds
    for (const embed of embeds) {
        await message.channel.send({ embeds: [embed] });
    }
}

// Repeat
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

    if (!message.guild) return sendError(message.channel, `Este comando solo va en servidores, ${userName}. ¡No me rompas las bolas!`);

    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay nada sonando, ${userName}. ¡Mandame un !play primero, loco!`);

    dataStore.musicSessions[message.guild.id] = dataStore.musicSessions[message.guild.id] || {};
    const historial = dataStore.musicSessions[message.guild.id].history || [];
    if (historial.length === 0 && !player.queue.previous) return sendError(message.channel, `No hay canciones anteriores, ${userName}. ¡Es el principio del camino, che!`);

    const args = message.content.split(' ').slice(1).join(' ').trim();
    const pasos = args ? parseInt(args) : 1;
    if (isNaN(pasos) || pasos < 1) return sendError(message.channel, `Mandame un número válido, ${userName}. Ejemplo: "!back 2", loco.`);

    const temasAnteriores = [...historial];
    if (player.queue.previous) temasAnteriores.unshift(player.queue.previous);

    if (pasos > temasAnteriores.length) return sendError(message.channel, `No hay tantas canciones atrás, ${userName}. Solo tengo ${temasAnteriores.length} en el historial.`);

    const temaObjetivo = temasAnteriores[pasos - 1]; // -1 porque el índice empieza en 0

    // Agregamos el tema objetivo al frente de la cola
    player.queue.unshift(temaObjetivo);
    player.stop(); // Saltamos el tema actual para que suene el anterior

    // Actualizamos el historial (el tema actual pasa al historial)
    if (player.queue.current) {
        dataStore.musicSessions[message.guild.id].history = [player.queue.current, ...temasAnteriores.slice(0, pasos - 1)];
        dataStoreModified = true;
    }

    await sendSuccess(message.channel, '⏮️ ¡Volviendo en el tiempo!', 
        `Ahora suena **${temaObjetivo.title}**, ${userName}. Retrocedí ${pasos} tema${pasos > 1 ? 's' : ''}, ¡una máquina del tiempo, che!`);
}

// Autoplay
async function manejarAutoplay(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (!message.guild) return sendError(message.channel, `Este comando solo va en servidores, ${userName}. ¡No me rompas las bolas!`);

    if (!message.member || !message.member.voice.channel) return sendError(message.channel, `Metete en un canal de voz primero, ${userName}. ¿Qué querés que haga sin música?`);

    const player = manager.players.get(message.guild.id);
    if (!player) return sendError(message.channel, `No hay nada sonando, ${userName}. ¡Mandame un !play primero, loco!`);

    dataStore.musicSessions[message.guild.id] = dataStore.musicSessions[message.guild.id] || {};
    const autoplayEnabled = dataStore.musicSessions[message.guild.id].autoplay || false;

    dataStore.musicSessions[message.guild.id].autoplay = !autoplayEnabled;
    dataStoreModified = true;

    const estado = dataStore.musicSessions[message.guild.id].autoplay;
    const mensaje = estado
        ? `🎵 ¡Autoplay prendido, ${userName}! Ahora sigo poniendo temas sin parar, loco. ¡A romperla!`
        : `⏹️ ¡Autoplay apagado, ${userName}! Cuando se acabe la cola, me callo la boca, che.`;
    
    await sendSuccess(message.channel, estado ? '🎵 ¡Autoplay activado!' : '⏹️ ¡Autoplay desactivado!', mensaje);
}

async function manejarAccion(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.slice(7).trim(); // Saco "!accion" y dejo el resto

    if (!args) {
        const embed = createEmbed('#FF1493', `¡Ey, ${userName}!`, 
            'Decime qué vas a hacer, loco. Ejemplo: `!accion me voy a dormir`. ¡Dale!');
        return await message.channel.send({ embeds: [embed] });
    }

    // Guardar la acción en dataStore
    dataStore.actions = dataStore.actions || {};
    dataStore.actions[message.author.id] = dataStore.actions[message.author.id] || [];
    const actionEntry = {
        action: args,
        timestamp: Date.now(),
        userId: message.author.id
    };
    dataStore.actions[message.author.id].push(actionEntry);
    dataStoreModified = true; // Marcamos para guardar

    // Respuesta personalizada según la acción
    let respuesta;
    switch (args.toLowerCase()) {
        case 'me voy a dormir':
            respuesta = `¡Buenas noches, ${userName}! Que sueñes con los angelitos, grosa. ¿Mate al despertar?`;
            break;
        case 'me voy de casa':
            respuesta = `¡Chau, ${userName}! ¿A dónde vas, loco? ¡Cuidate y avisá cuando vuelvas, dale!`;
            break;
        case 'me morí':
            respuesta = `¡Nooo, ${userName}! ¿Qué pasó, boludo? ¿Revivís con un mate o qué? ¡Posta, no me dejes solo!`;
            break;
        default:
            respuesta = `¡Ojo, ${userName}! Vas a "${args}", ¿eh? ¡A romperla, grosa! ¿Qué más contás?`;
    }

    const embed = createEmbed('#FF1493', `¡Acción de ${userName}!`, respuesta);
    await message.channel.send({ embeds: [embed] });

    // Avisar al otro por DM
    const otherUserId = message.author.id === OWNER_ID ? ALLOWED_USER_ID : OWNER_ID;
    try {
        const otherUser = await client.users.fetch(otherUserId);
        const dmEmbed = createEmbed('#FF1493', `¡Ey, ${otherUser.id === OWNER_ID ? 'Miguel' : 'Belén'}!`, 
            `${userName} dijo: "${args}". ¡Enterate al toque, loco!`);
        await otherUser.send({ embeds: [dmEmbed] });
    } catch (error) {
        console.error(`Error enviando DM a ${otherUserId}: ${error.message}`);
    }
}

// Ranking con top por categoría para Trivia, Reacciones y PPM
function getCombinedRankingEmbed(userId, username) {
    const categorias = Object.keys(preguntasTriviaSinOpciones);
    
    // Lista de trivia por categoría
    let triviaList = '**📚 Trivia por Categoría**\n';
    categorias.forEach(categoria => {
        const luzStats = dataStore.triviaStats[ALLOWED_USER_ID]?.[categoria] || { correct: 0, total: 0 };
        const luzScore = luzStats.correct;
        const luzPercentage = luzStats.total > 0 ? Math.round((luzScore / luzStats.total) * 100) : 0;

        const ranking = [
            { name: 'Belén', score: luzScore, percentage: luzPercentage }
        ].sort((a, b) => b.score - a.score);

        triviaList += `\n**${categoria.charAt(0).toUpperCase() + categoria.slice(1)}** 🎲\n` +
                      ranking.map(participant => 
                          `> 🌟 ${participant.name}: **${participant.score} puntos** (${participant.percentage}% acertadas)`
                      ).join('\n') + '\n';
    });

    // Récords de PPM
    const luzPPMRecord = dataStore.personalPPMRecords[ALLOWED_USER_ID]?.best || { ppm: 0, timestamp: null };
    const ppmRanking = [
        { name: 'Belén', ppm: luzPPMRecord.ppm, timestamp: luzPPMRecord.timestamp }
    ].sort((a, b) => b.ppm - a.ppm);
    let ppmList = ppmRanking.map(participant => 
        participant.ppm > 0 
            ? `> ${participant.name}: **${participant.ppm} PPM** - ${new Date(participant.timestamp).toLocaleString()}`
            : `> ${participant.name}: No tiene récord aún. ¡Probá con !pp!`
    ).join('\n');

    // Victorias en reacciones
    const miguelReactionWins = dataStore.reactionWins[OWNER_ID]?.wins || 0;
    const luzReactionWins = dataStore.reactionWins[ALLOWED_USER_ID]?.wins || 0;
    const reactionRanking = [
        { name: 'Belén', wins: luzReactionWins }
    ].sort((a, b) => b.wins - a.wins);
    const reactionList = reactionRanking.map(participant => 
        `> 🌟 ${participant.name} - **${participant.wins} Reacciones**`
    ).join('\n');

    // Adivinanzas
    const luzAdivinanzaStats = dataStore.adivinanzaStats[ALLOWED_USER_ID] || { correct: 0, total: 0 };
    const adivinanzaRanking = [
        { name: 'Belén', correct: luzAdivinanzaStats.correct, percentage: luzAdivinanzaStats.total > 0 ? Math.round((luzAdivinanzaStats.correct / luzAdivinanzaStats.total) * 100) : 0 }
    ].sort((a, b) => b.correct - a.correct);
    const adivinanzaList = adivinanzaRanking.map(participant => 
        `> 🌟 ${participant.name}: **${participant.correct} aciertos** (${participant.percentage}% acertadas)`
    ).join('\n');

    // Armo el embed con todo
    return new EmbedBuilder()
        .setColor('#FF1493')
        .setTitle(`🏆 Ranking de ${username}`)
        .setDescription('¡Aquí están tus logros, ordenados por los cracks que la rompen!')
        .addFields(
            { name: '📊 Trivia', value: triviaList, inline: false },
            { name: '⌨️ PPM (Récord Más Rápido)', value: ppmList, inline: false },
            { name: '⚡ Victorias en Reacciones', value: reactionList, inline: false },
            { name: '🧠 Adivinanzas', value: adivinanzaList, inline: false } 
        )
        .setFooter({ text: 'Con cariño Oliver IA' })
        .setTimestamp();
}

// RankingPPM
async function manejarRankingPPM(message) {
    // Te muestro tu historial de PPM, re copado
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const userId = message.author.id;

    // Agarro tus datos de PPM
    const ppmData = dataStore.personalPPMRecords[userId] || { best: { ppm: 0, timestamp: null }, attempts: [] };
    const attempts = ppmData.attempts;

    // Si no tenés intentos, te aviso en rojo
    if (attempts.length === 0) {
        await sendError(message.channel, 'No tienes intentos de PPM registrados', `¡Juega con !pp para empezar, ${userName}!`);
        return;
    }

    // Ordeno los intentos de mayor a menor
    const sortedAttempts = attempts.sort((a, b) => b.ppm - a.ppm);
    const attemptsList = sortedAttempts.map((attempt, index) => 
        `${index + 1}. **${attempt.ppm} PPM** - ${new Date(attempt.timestamp).toLocaleString()}`
    ).join('\n');

    // Embed dorado con tu historial
    const embed = new EmbedBuilder()
        .setColor('#FF1493')
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

async function manejarChiste(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const userId = message.author.id;
    const genderSuffix = userName === 'Miguel' ? 'o' : 'a';

    const waitingEmbed = createEmbed('#FF1493', `😂 Preparándome, ${userName}...`, 
        `Aguantá que te hago reír al toque, loco...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

const chistes = [
    { setup: '¿Qué hace un argentino cuando se corta la luz?', punchline: '¡Saca el mate y arma un fogón en el patio! Vos también sos puro ingenio, ${userName}.' },
    { setup: '¿Por qué el argentino no usa reloj?', punchline: '¡Porque vive a horario de asado, cuando se prende el fuego! Igual que vos, ${userName}, un crack.' },
    { setup: '¿Qué le dice un porteño al bondi que no para?', punchline: '¡“Pará, boludo, que no soy Usain Bolt!” Vos sí que zumbás, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el mate está bueno?', punchline: '¡Porque la yerba le hace ojitos! Igual que vos, ${userName}, puro paladar.' },
    { setup: '¿Qué hace un argentino con un billete roto?', punchline: '¡Lo pega con cinta y lo gasta en birra! Vos también sos recursiv${userName === "Miguel" ? "o" : "a"}, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en la 9 de Julio?', punchline: '¡Porque sigue el olor a choripán! Como vos, ${userName}, puro instinto.' },
    { setup: '¿Qué le dice un cordobés al fernet caliente?', punchline: '¡“Enfriate, loco, que no sos sopa!” Vos traés el frío, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come asado?', punchline: '¡“Un turista en la parrilla, che!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué hace un argentino cuando llueve?', punchline: '¡Saca la guitarrita y hace un fogón adentro! Igual que vos, ${userName}, puro flow.' },
    { setup: '¿Por qué el argentino no usa GPS?', punchline: '¡Porque se guía por el humo del asado! Como vos, ${userName}, siempre al toque.' },
    { setup: '¿Qué le dice un argentino al que llega tarde al asado?', punchline: '¡“Apuráte, boludo, que el chori se enfría!” Vos sos puntual, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme al frío?', punchline: '¡Porque tiene más frazadas que almacén! Igual que vos, ${userName}, puro aguante.' },
    { setup: '¿Qué hace un argentino con una pizza fría?', punchline: '¡La calienta y le pone fainá encima! Vos también le das vida, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el partido está bravo?', punchline: '¡Porque el barrio grita más que Boca y River juntos! Igual que vos, ${userName}, pura pasión.' },
    { setup: '¿Qué le dice un mendocino al vino caro?', punchline: '¡“Bajá un cambio, loco, que no soy millonario!” Vos sí que zumbás, ${userName}.' },
    { setup: '¿Por qué el argentino no se raja en el calor?', punchline: '¡Porque se toma una birra helada y listo! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un mate lavado?', punchline: '¡Lo cambia más rápido que camiseta en la cancha! Vos también sos rapid${userName === "Miguel" ? "o" : "a"}, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no toma mate?', punchline: '¡“Un extranjero en la ronda, che!” Vos sos de ley, ${userName}.' },
    { setup: '¿Qué le dice un rosarino al río Paraná?', punchline: '¡“Quedate tranqui, loco, que ya traigo la birra!” Igual que vos, ${userName}, pura onda.' },
    { setup: '¿Por qué el argentino no usa paraguas?', punchline: '¡Porque la lluvia es su excusa pa’ quedarse con el mate! Como vos, ${userName}, puro ingenio.' },
    { setup: '¿Qué hace un argentino cuando el equipo pierde?', punchline: '¡“La próxima, che, que el amor no se negocia!” Vos también sos fiel, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el asado está listo?', punchline: '¡Porque el olor lo levanta de la cama! Igual que vos, ${userName}, puro olfato.' },
    { setup: '¿Qué le dice un porteño al subte lleno?', punchline: '¡“Movete, boludo, que no soy sardina!” Vos también tenés calle, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en el Obelisco?', punchline: '¡Porque el ruido lo guía como brújula! Como vos, ${userName}, siempre al día.' },
    { setup: '¿Qué hace un argentino con un alfajor vencido?', punchline: '¡Se lo come igual y dice que está vintage! Vos también aprovechás, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come milanesa?', punchline: '¡“Un hereje de la cocina, loco!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet sin hielo?', punchline: '¡“Ponete las pilas, che, que esto no va!” Igual que vos, ${userName}, puro fuego.' },
    { setup: '¿Por qué el argentino no usa despertador?', punchline: '¡Porque el mate lo saca de la cama! Como vos, ${userName}, siempre al pie del cañón.' },
    { setup: '¿Qué hace un argentino con una factura seca?', punchline: '¡La moja en mate y la salva! Vos también tenés ese toque, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el domingo es perfecto?', punchline: '¡Porque huele a asado y suena un partido! Igual que vos, ${userName}, pura pasión.' },
    { setup: '¿Qué le dice un argentino al que no baila tango?', punchline: '¡“Movete, che, que no sos poste!” Vos tenés swing, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme al dólar?', punchline: '¡Porque siempre tiene un plan B en pesos! Como vos, ${userName}, puro talento.' },
    { setup: '¿Qué hace un argentino con un choripán sin chimichurri?', punchline: '¡Lo devuelve y pide actitud! Vos también tenés sabor, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que la birra está helada?', punchline: '¡Porque el vaso llora de frío! Igual que vos, ${userName}, puro ojo.' },
    { setup: '¿Qué le dice un santafesino al río?', punchline: '¡“Quedate tranqui, loco, que traigo el liso!” Vos también refrescás, ${userName}.' },
    { setup: '¿Por qué el argentino no usa bufanda?', punchline: '¡Porque el mate ya le calienta el alma! Como vos, ${userName}, puro calor.' },
    { setup: '¿Qué hace un argentino cuando no hay carne?', punchline: '¡Saca papas y hace una tortilla al toque! Vos también improvisás, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no toma vino?', punchline: '¡“Un seco sin remedio, che!” Vos sos más copad${userName === "Miguel" ? "o" : "a"}, ${userName}.' },
    { setup: '¿Qué le dice un argentino al que no come empanadas?', punchline: '¡“Estás negado pa’ lo bueno, boludo!” Vos sí que le das, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en la cancha?', punchline: '¡Porque el grito lo lleva al gol! Como vos, ${userName}, pura pasión.' },
    { setup: '¿Qué hace un argentino con un mate frío?', punchline: '¡Lo calienta y le da vida otra vez! Vos también reciclás, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el locro está listo?', punchline: '¡Porque el olor cruza la cuadra! Igual que vos, ${userName}, puro instinto.' },
    { setup: '¿Qué le dice un porteño al que no usa mate?', punchline: '¡“Viví un poco, che, que esto es cultura!” Vos sí que sabés, ${userName}.' },
    { setup: '¿Por qué el argentino no usa aire acondicionado?', punchline: '¡Porque el ventilador es su amigo de la infancia! Como vos, ${userName}, simple y efectivo.' },
    { setup: '¿Qué hace un argentino cuando el bondi no viene?', punchline: '¡Se toma un mate y espera con onda! Vos también tenés paciencia, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come pizza?', punchline: '¡“Un perdido en la vida, loco!” Vos sos de ley, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet sin soda?', punchline: '¡“Completate, boludo, que estás a medias!” Igual que vos, ${userName}, siempre complet${userName === "Miguel" ? "o" : "a"}.' },
    { setup: '¿Por qué el argentino no le teme al apagón?', punchline: '¡Porque saca la guitarra y hace un fogón! Como vos, ${userName}, siempre prendid${userName === "Miguel" ? "o" : "a"}.' },
    { setup: '¿Qué hace un argentino con un sánguche de miga viejo?', punchline: '¡Lo tuesta y lo hace milanesa! Vos también aprovechás, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el viernes llegó?', punchline: '¡Porque el asado ya está en el aire! Igual que vos, ${userName}, pura fiesta.' },
    { setup: '¿Qué le dice un argentino al que no toma café?', punchline: '¡“Estás dormido, che, despertate con algo!” Vos tenés pila, ${userName}.' },
    { setup: '¿Por qué el argentino no usa gorra?', punchline: '¡Porque el sol ya le tatuó la frente! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un dulce de leche vencido?', punchline: '¡Lo come igual y dice que está curado! Vos también tenés ese toque, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el tango es bueno?', punchline: '¡Porque el bandoneón le saca lágrimas! Igual que vos, ${userName}, puro sentimiento.' },
    { setup: '¿Qué le dice un rosarino al que no come liso?', punchline: '¡“Estás negado pa’ lo nuestro, loco!” Vos sí que le das, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en la Costanera?', punchline: '¡Porque el río lo guía con su mate! Como vos, ${userName}, puro rumbo.' },
    { setup: '¿Qué hace un argentino con una factura sin dulce?', punchline: '¡Le pone más y la hace épica! Vos también le ponés onda, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no va al asado?', punchline: '¡“Un ausente sin excusa, che!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué le dice un mendocino al vino tibio?', punchline: '¡“Enfriate, loco, que no sos mate!” Igual que vos, ${userName}, puro frío.' },
    { setup: '¿Por qué el argentino no usa botas en la lluvia?', punchline: '¡Porque las ojotas son su bandera! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un mate sin yerba?', punchline: '¡Lo llena al toque y no se rinde! Vos también tenés actitud, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que la milanesa es perfecta?', punchline: '¡Porque cruje como hinchada en la cancha! Igual que vos, ${userName}, puro ruido.' },
    { setup: '¿Qué le dice un porteño al que no usa subte?', punchline: '¡“Caminá, boludo, que no sos turista!” Vos tenés calle, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme al frío?', punchline: '¡Porque el mate lo abraza desde adentro! Como vos, ${userName}, puro calor.' },
    { setup: '¿Qué hace un argentino con una pizza sin muzzarella?', punchline: '¡La devuelve y pide una de verdad! Vos también tenés carácter, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come locro?', punchline: '¡“Un perdido en mayo, loco!” Vos sos de ley, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet aguado?', punchline: '¡“Ponete fuerte, che, que esto es Córdoba!” Igual que vos, ${userName}, puro nervio.' },
    { setup: '¿Por qué el argentino no usa despertador los domingos?', punchline: '¡Porque el asado lo llama solito! Como vos, ${userName}, siempre al pie.' },
    { setup: '¿Qué hace un argentino con un choripán sin pan?', punchline: '¡Lo come con la mano y lo disfruta igual! Vos también improvisás, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el partido es clásico?', punchline: '¡Porque el grito cruza el Riachuelo! Igual que vos, ${userName}, pura pasión.' },
    { setup: '¿Qué le dice un argentino al que no toma birra?', punchline: '¡“Viví un poco, che, que esto es Argentina!” Vos sí que sabés, ${userName}.' },
    { setup: '¿Por qué el argentino no usa camisa cerrada?', punchline: '¡Porque el calor ya le abrió el pecho! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un mate amargo?', punchline: '¡Lo toma igual y dice que es tradición! Vos también tenés aguante, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el asado es caro?', punchline: '¡Porque la vaca le guiña el ojo desde el precio! Igual que vos, ${userName}, puro ojo.' },
    { setup: '¿Qué le dice un rosarino al que no come pescado?', punchline: '¡“Estás negado pa’l río, loco!” Vos sí que le das, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en la Patagonia?', punchline: '¡Porque el viento lo empuja al mate! Como vos, ${userName}, puro rumbo.' },
    { setup: '¿Qué hace un argentino con un alfajor sin dulce?', punchline: '¡Le pone más y lo hace rey! Vos también le ponés chispa, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no baila cuarteto?', punchline: '¡“Un palo de escoba, che!” Vos tenés flow, ${userName}.' },
    { setup: '¿Qué le dice un mendocino al vino dulce?', punchline: '¡“Ponete serio, loco, que esto es Mendoza!” Igual que vos, ${userName}, puro carácter.' },
    { setup: '¿Por qué el argentino no usa gorra en verano?', punchline: '¡Porque el sol ya le dio color! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con una empanada fría?', punchline: '¡La calienta y la hace épica! Vos también tenés ese toque, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el tango es puro?', punchline: '¡Porque el bandoneón le pone piel de gallina! Igual que vos, ${userName}, puro sentimiento.' },
    { setup: '¿Qué le dice un porteño al que no usa mate?', punchline: '¡“Estás seco, boludo, sumate a la ronda!” Vos sos más copad${userName === "Miguel" ? "o" : "a"}, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme a la inflación?', punchline: '¡Porque siempre tiene un mango pa’l asado! Como vos, ${userName}, puro talento.' },
    { setup: '¿Qué hace un argentino con un sánguche sin miga?', punchline: '¡Lo llena de milanesa y lo salva! Vos también improvisás, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come fainá?', punchline: '¡“Un perdido en la pizzería, che!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet sin coca?', punchline: '¡“Completate, loco, que esto no es juego!” Igual que vos, ${userName}, siempre al toque.' },
    { setup: '¿Por qué el argentino no usa reloj en la cancha?', punchline: '¡Porque el gol marca el tiempo! Como vos, ${userName}, pura pasión.' },
    { setup: '¿Qué hace un argentino con un mate sin bombilla?', punchline: '¡Lo toma con cucharita y no se raja! Vos también tenés actitud, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que la birra es buena?', punchline: '¡Porque el frío le hace cosquillas! Igual que vos, ${userName}, puro paladar.' },
    { setup: '¿Qué le dice un argentino al que no come choripán?', punchline: '¡“Estás negado pa’ lo nuestro, boludo!” Vos sí que le das, ${userName}.' },
    { setup: '¿Por qué el argentino no usa paraguas en invierno?', punchline: '¡Porque el mate lo cubre del frío! Como vos, ${userName}, puro calor.' },
    { setup: '¿Qué hace un argentino con un locro aguado?', punchline: '¡Le pone más zapallo y lo hace rey! Vos también le ponés onda, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el partido es bravo?', punchline: '¡Porque el grito cruza la General Paz! Igual que vos, ${userName}, pura pasión.' },
    { setup: '¿Qué le dice un rosarino al que no toma liso?', punchline: '¡“Estás seco, loco, refrescate con algo!” Vos sos más refrescante, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en el campo?', punchline: '¡Porque el mate lo trae de vuelta! Como vos, ${userName}, puro rumbo.' },
    { setup: '¿Qué hace un argentino con una pizza sin fainá?', punchline: '¡La pide al toque y la completa! Vos también tenés carácter, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no canta en la hinchada?', punchline: '¡“Un mute en la tribuna, che!” Vos tenés voz, ${userName}.' },
    { setup: '¿Qué le dice un mendocino al vino blanco?', punchline: '¡“Ponete fresco, loco, que esto es verano!” Igual que vos, ${userName}, puro frío.' },
    { setup: '¿Por qué el argentino no usa botas en la ciudad?', punchline: '¡Porque las zapas son su bandera! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un mate sin azúcar?', punchline: '¡Lo toma amargo y dice que es de hombre! Vos también tenés aguante, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que la milanesa es casera?', punchline: '¡Porque lleva amor en cada rebozado! Igual que vos, ${userName}, puro corazón.' },
    { setup: '¿Qué le dice un porteño al que no usa bondi?', punchline: '¡“Subite, boludo, que no sos de Palermo!” Vos tenés calle, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme al calor?', punchline: '¡Porque la birra helada lo salva siempre! Como vos, ${userName}, puro talento.' },
    { setup: '¿Qué hace un argentino con un sánguche de milanesa frío?', punchline: '¡Lo calienta y le pone tomate! Vos también improvisás, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come asado?', punchline: '¡“Un vegetariano perdido, che!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet tibio?', punchline: '¡“Enfriate, loco, que esto es serio!” Igual que vos, ${userName}, puro nervio.' },
    { setup: '¿Por qué el argentino no usa despertador en verano?', punchline: '¡Porque el mate lo saca de la siesta! Como vos, ${userName}, siempre al toque.' },
    { setup: '¿Qué hace un argentino con un choripán sin chimichurri?', punchline: '¡Lo pide al toque y lo hace épico! Vos también tenés sabor, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el tango es clásico?', punchline: '¡Porque el compás te lleva al alma! Igual que vos, ${userName}, puro ritmo.' },
    { setup: '¿Qué le dice un argentino al que no toma vino?', punchline: '¡“Estás seco, che, hidratate con clase!” Vos sos más copad${userName === "Miguel" ? "o" : "a"}, ${userName}.' },
    { setup: '¿Por qué el argentino no usa corbata?', punchline: '¡Porque el asado ya lo viste de gala! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un mate lavado?', punchline: '¡Lo cambia más rápido que River en el descenso! Vos también zumbás, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el locro es bueno?', punchline: '¡Porque te calienta hasta el alma! Igual que vos, ${userName}, puro calor.' },
    { setup: '¿Qué le dice un rosarino al que no come pescado?', punchline: '¡“Estás negado pa’l Paraná, loco!” Vos sí que le das, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en la Pampa?', punchline: '¡Porque el mate lo guía como faro! Como vos, ${userName}, puro rumbo.' },
    { setup: '¿Qué hace un argentino con una pizza sin oliva?', punchline: '¡Le pone más y la hace reina! Vos también le ponés chispa, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no baila chamamé?', punchline: '¡“Un palo del litoral, che!” Vos tenés flow, ${userName}.' },
    { setup: '¿Qué le dice un mendocino al vino tinto?', punchline: '¡“Ponete serio, loco, que esto es Mendoza!” Igual que vos, ${userName}, puro carácter.' },
    { setup: '¿Por qué el argentino no usa gorra en invierno?', punchline: '¡Porque el mate ya le calienta la cabeza! Como vos, ${userName}, puro calor.' },
    { setup: '¿Qué hace un argentino con una empanada sin carne?', punchline: '¡La rellena y la hace épica! Vos también tenés ese toque, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el partido es épico?', punchline: '¡Porque el grito cruza la Cordillera! Igual que vos, ${userName}, pura pasión.' },
    { setup: '¿Qué le dice un porteño al que no usa mate?', punchline: '¡“Estás seco, boludo, sumate a la ronda!” Vos sos más refrescante, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme al frío patagónico?', punchline: '¡Porque el mate lo abriga como frazada! Como vos, ${userName}, puro calor.' },
    { setup: '¿Qué hace un argentino con un sánguche sin fiambre?', punchline: '¡Lo llena de milanesa y lo salva! Vos también improvisás, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come fainá?', punchline: '¡“Un perdido en la pizzería, loco!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet sin hielo?', punchline: '¡“Ponete las pilas, che, que esto es Córdoba!” Igual que vos, ${userName}, puro nervio.' },
    { setup: '¿Por qué el argentino no usa reloj en el asado?', punchline: '¡Porque el hambre marca el tiempo! Como vos, ${userName}, pura pasión.' },
    { setup: '¿Qué hace un argentino con un mate sin yerba?', punchline: '¡Lo llena al toque y no se raja! Vos también tenés actitud, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que la birra es perfecta?', punchline: '¡Porque el frío le saca una sonrisa! Igual que vos, ${userName}, puro paladar.' },
    { setup: '¿Qué le dice un argentino al que no come choripán?', punchline: '¡“Estás negado pa’ lo nuestro, che!” Vos sí que le das, ${userName}.' },
    { setup: '¿Por qué el argentino no usa paraguas en verano?', punchline: '¡Porque la birra lo refresca desde adentro! Como vos, ${userName}, puro talento.' },
    { setup: '¿Qué hace un argentino con un locro frío?', punchline: '¡Lo calienta y lo hace rey otra vez! Vos también reciclás, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el tango es puro?', punchline: '¡Porque el bandoneón te lleva al barrio! Igual que vos, ${userName}, puro sentimiento.' },
    { setup: '¿Qué le dice un rosarino al que no toma liso?', punchline: '¡“Estás seco, loco, hidratate con onda!” Vos sos más copad${userName === "Miguel" ? "o" : "a"}, ${userName}.' },
    { setup: '¿Por qué el argentino no se pierde en la ciudad?', punchline: '¡Porque el mate lo guía como GPS! Como vos, ${userName}, puro rumbo.' },
    { setup: '¿Qué hace un argentino con una pizza sin muzzarella?', punchline: '¡La devuelve y pide una de verdad! Vos también tenés carácter, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no canta en la cancha?', punchline: '¡“Un mute en la popular, che!” Vos tenés voz, ${userName}.' },
    { setup: '¿Qué le dice un mendocino al vino caliente?', punchline: '¡“Enfriate, loco, que esto es serio!” Igual que vos, ${userName}, puro frío.' },
    { setup: '¿Por qué el argentino no usa botas en el campo?', punchline: '¡Porque las zapas son su orgullo! Como vos, ${userName}, puro estilo.' },
    { setup: '¿Qué hace un argentino con un mate sin bombilla?', punchline: '¡Lo toma con cucharita y sigue el vacile! Vos también tenés actitud, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el asado es épico?', punchline: '¡Porque el humo cruza el Río de la Plata! Igual que vos, ${userName}, pura pasión.' },
    { setup: '¿Qué le dice un porteño al que no usa subte?', punchline: '¡“Bajá, boludo, que no sos de Recoleta!” Vos tenés calle, ${userName}.' },
    { setup: '¿Por qué el argentino no le teme al invierno?', punchline: '¡Porque el mate lo calienta como estufa! Como vos, ${userName}, puro calor.' },
    { setup: '¿Qué hace un argentino con un sánguche sin milanesa?', punchline: '¡Lo rellena y lo hace rey! Vos también le ponés chispa, ${userName}.' },
    { setup: '¿Cómo llama un argentino al que no come empanadas?', punchline: '¡“Un perdido en la mesa, che!” Vos sos de pura cepa, ${userName}.' },
    { setup: '¿Qué le dice un cordobés al fernet sin soda?', punchline: '¡“Completate, loco, que esto es cuarteto!” Igual que vos, ${userName}, puro ritmo.' },
    { setup: '¿Por qué el argentino no usa reloj en la siesta?', punchline: '¡Porque el mate marca la hora! Como vos, ${userName}, pura onda.' },
    { setup: '¿Qué hace un argentino con un choripán sin salsa?', punchline: '¡Le pone chimichurri y lo hace épico! Vos también tenés sabor, ${userName}.' },
    { setup: '¿Cómo sabe un argentino que el partido es clásico?', punchline: '¡Porque el grito se escucha hasta el Obelisco! Igual que vos, ${userName}, pura pasión.' }
];

    try {
        dataStore.usedJokes = dataStore.usedJokes || {};
        dataStore.usedJokes[userId] = dataStore.usedJokes[userId] || [];

        let availableChistes = chistes.filter((_, index) => !dataStore.usedJokes[userId].includes(index));

        if (availableChistes.length === 0) {
            dataStore.usedJokes[userId] = [];
            availableChistes = chistes;
            console.log(`Reiniciando chistes para ${userName} (${userId}), se agotaron los disponibles.`);
        }

        const randomIndex = Math.floor(Math.random() * availableChistes.length);
        const chiste = availableChistes[randomIndex];
        const chisteIndex = chistes.indexOf(chiste);

        // Guardamos el índice del chiste usado
        dataStore.usedJokes[userId].push(chisteIndex);
        dataStoreModified = true; // Marcamos que dataStore cambió para guardarlo después

        let punchlineFixed = chiste.punchline
            .replace(/\${userName}/g, userName)
            .replace(/\${userName === "Miguel" \? "o" : "a"}/g, genderSuffix);

        // Embed con el chiste
        const embed = createEmbed('#FF1493', `😂 ¡Chiste pa’ ${userName}!`, 
            `Che ${userName}, ¡posta que te vas a reír, loco! Acá va:\n\n` +
            `**${chiste.setup}**\n${punchlineFixed}\n\n` +
            `¿Qué tal, ${userName}? Si querés otro, pedímelo nomás. ¡Sos tan copad${genderSuffix} que te merecés reír todo el día, che!`)
            .setFooter({ text: `Con cariño, Oliver IA | Reacciona con ✅ o ❌`, iconURL: client.user.avatarURL() });

        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error tirando chiste: ${error.message}`);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No pude tirar el chiste, ${userName}. Algo se rompió, loco. ¿Probamos de nuevo?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Dato
async function manejarDato(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!dato') 
        ? message.content.slice(5).trim() 
        : message.content.slice(3).trim();

    const waitingEmbed = createEmbed('#FF1493', `⌛ Buscando, ${userName}...`, 
        `Dame un segundo que te traigo algo copado${args ? ` sobre "${args}"` : ''}, loco...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    // Lista de datos randoms copados
const randomFacts = [
    {
        title: '¡Gatos saltarines!',
        text: 'Los gatos pueden saltar hasta 6 veces su longitud en un solo brinco. ¡Unos atletas felinos! Igual que vos, ' + userName + ', siempre dando el salto zarpado, che.'
    },
    {
        title: '¡Abejas bailarinas!',
        text: 'Las abejas hacen un baile en forma de 8 pa’ decirle a sus compañeras dónde está la comida. ¡Unas coreógrafas del aire! Vos también tenés ese ritmo, ' + userName + ', pa’ romperla toda.'
    },
    {
        title: '¡Elefantes memoriosos!',
        text: 'Los elefantes nunca olvidan dónde dejaron el agua, incluso años después. ¡Una memoria bestial! Igual que vos, ' + userName + ', que no te perdés ni un asado, loco.'
    },
    {
        title: '¡Canguros boxeadores!',
        text: 'Los canguros macho se dan piñas pa’ impresionar a las hembras. ¡Unos campeones del ring! Vos, ' + userName + ', también la rompés con estilo, che.'
    },
    {
        title: '¡Lobos cantores!',
        text: 'Los lobos aúllan pa’ hablarse entre sí a kilómetros de distancia. ¡Unos rockeros de la naturaleza! Igual que vos, ' + userName + ', siempre con voz fuerte, posta.'
    },
    {
        title: '¡Tiburones dormilones!',
        text: 'Algunos tiburones duermen con los ojos abiertos y nadando pa’ no hundirse. ¡Unos genios multitasking! Como vos, ' + userName + ', que hacés todo al toque.'
    },
    {
        title: '¡Ranas venenosas!',
        text: 'La rana dardo venenoso tiene tanto veneno en su piel que puede matar a 10 personas con un toque. ¡Una mini asesina! Igual, ' + userName + ', vos matás con tu onda.'
    },
    {
        title: '¡Camaleones artistas!',
        text: 'Los camaleones cambian de color no solo pa’ camuflarse, sino también pa’ mostrar su humor. ¡Unos cracks expresivos! Vos, ' + userName + ', también tenés ese flow, che.'
    },
    {
        title: '¡Delfines charlatanes!',
        text: 'Los delfines tienen nombres propios que se silban entre ellos. ¡Unos capos de la comunicación! Igual que vos, ' + userName + ', siempre al pie del cañón.'
    },
    {
        title: '¡Murciélagos ecológicos!',
        text: 'Un murciélago puede comer hasta 1.000 mosquitos en una noche. ¡Un héroe nocturno! Vos, ' + userName + ', también limpiás la cancha, loco.'
    },
    {
        title: '¡Arañas ingenieras!',
        text: 'Las arañas tejen telas más fuertes que el acero, peso por peso. ¡Unas arquitectas zarpadas! Igual que vos, ' + userName + ', siempre construyendo algo grosso.'
    },
    {
        title: '¡Koalas vagos!',
        text: 'Los koalas duermen hasta 22 horas al día pa’ ahorrar energía. ¡Unos fiacas profesionales! Vos, ' + userName + ', sos puro motor en comparación, che.'
    },
    {
        title: '¡Leones rugidores!',
        text: 'El rugido de un león se escucha a 8 kilómetros de distancia. ¡Un parlante natural! Igual que vos, ' + userName + ', que hacés temblar el barrio.'
    },
    {
        title: '¡Perezosos lentos!',
        text: 'Un perezoso tarda un mes en digerir una hoja. ¡El rey de la pachorra! Vos, ' + userName + ', zumbás mucho más rápido, loco.'
    },
    {
        title: '¡Avestruces velocistas!',
        text: 'Un avestruz corre a 70 km/h, más rápido que un caballo. ¡Un bólido con plumas! Igual que vos, ' + userName + ', siempre a full gas.'
    },
    {
        title: '¡Ballenas cantantes!',
        text: 'Las ballenas jorobadas cantan canciones que duran horas y se copian entre ellas. ¡Unas rockstars del mar! Vos, ' + userName + ', también tenés tu hit, che.'
    },
    {
        title: '¡Cocodrilos llorones!',
        text: 'Los cocodrilos lloran mientras comen, pero no de tristeza, es pa’ lubricar los ojos. ¡Unos actores dramáticos! Igual que vos, ' + userName + ', siempre con onda.'
    },
    {
        title: '¡Hormigas fuertes!',
        text: 'Una hormiga puede cargar 50 veces su peso. ¡Una forzuda diminuta! Vos, ' + userName + ', también levantás lo que sea, loco.'
    },
    {
        title: '¡Búhos giratorios!',
        text: 'Los búhos pueden girar la cabeza 270 grados sin moverse. ¡Unos contorsionistas! Igual que vos, ' + userName + ', siempre mirando pa’ todos lados.'
    },
    {
        title: '¡Pavos reales coquetos!',
        text: 'El pavo real usa su cola pa’ conquistar, pero no vuela bien por el peso. ¡Un galán con estilo! Vos, ' + userName + ', también tenés tu charme, che.'
    },
    {
        title: '¡Tortugas viajeras!',
        text: 'Las tortugas marinas recorren miles de kilómetros pa’ volver a su playa natal. ¡Unas GPS vivientes! Igual que vos, ' + userName + ', siempre encontrás el camino.'
    },
    {
        title: '¡Zorros astutos!',
        text: 'Los zorros árticos cazan escuchando bajo la nieve y saltan pa’ atrapar presas. ¡Unos ninjas blancos! Vos, ' + userName + ', también tenés ese olfato, loco.'
    },
    {
        title: '¡Flamencos equilibristas!',
        text: 'Los flamencos duermen parados en una pata pa’ no gastar energía. ¡Unos cracks del balance! Igual que vos, ' + userName + ', siempre firme.'
    },
    {
        title: '¡Serpientes mudadoras!',
        text: 'Las serpientes cambian de piel hasta 4 veces al año pa’ crecer. ¡Unas reinas del makeover! Vos, ' + userName + ', también te renovás siempre, che.'
    },
    {
        title: '¡Orcas estrategas!',
        text: 'Las orcas cazan en equipo y usan olas pa’ tirar focas al agua. ¡Unas maestras del teamwork! Igual que vos, ' + userName + ', siempre jugando en equipo.'
    },
    {
        title: '¡Ciervos cornudos!',
        text: 'Los ciervos pierden y regeneran sus cuernos cada año. ¡Unos renovadores natos! Vos, ' + userName + ', también volvés más fuerte, loco.'
    },
    {
        title: '¡Pandas glotones!',
        text: 'Un panda come hasta 12 kilos de bambú al día pa’ sobrevivir. ¡Un campeón del morfi! Igual que vos, ' + userName + ', con el asado.'
    },
    {
        title: '¡Halcones veloces!',
        text: 'El halcón peregrino baja en picada a 300 km/h pa’ cazar. ¡Un misil con plumas! Vos, ' + userName + ', también zumbás a mil, che.'
    },
    {
        title: '¡Medusas inmortales!',
        text: 'La medusa *Turritopsis* puede volver a su estado juvenil después de vieja. ¡Una eterna joven! Igual que vos, ' + userName + ', siempre con pilas.'
    },
    {
        title: '¡Peces payaso hogareños!',
        text: 'Los peces payaso viven entre anémonas venenosas pa’ protegerse. ¡Unos cracks del barrio! Vos, ' + userName + ', también tenés tu lugar, loco.'
    },
    {
        title: '¡Cucarachas sobrevivientes!',
        text: 'Una cucaracha puede vivir semanas sin cabeza hasta que se muere de hambre. ¡Unas duras posta! Igual que vos, ' + userName + ', puro aguante.'
    },
    {
        title: '¡Lémures fiesteros!',
        text: 'Los lémures de Madagascar se juntan en grupos pa’ cantar y bailar. ¡Unos locos del vacile! Vos, ' + userName + ', también armás la joda, che.'
    },
    {
        title: '¡Pingüinos nadadores!',
        text: 'Los pingüinos pueden nadar a 36 km/h pa’ escapar de depredadores. ¡Unos torpedos con smoking! Igual que vos, ' + userName + ', siempre escapando con estilo.'
    },
    {
        title: '¡Jirafas altas!',
        text: 'Las jirafas tienen el cuello más largo del reino animal, pero solo 7 vértebras como nosotros. ¡Unas cracks del estirón! Vos, ' + userName + ', también destacás.'
    },
    {
        title: '¡Osos dormilones!',
        text: 'Los osos polares hibernan hasta 8 meses sin comer ni moverse mucho. ¡Unos fiacas zarpados! Vos, ' + userName + ', sos puro movimiento, loco.'
    },
    {
        title: '¡Gorilas fuertes!',
        text: 'Un gorila puede levantar hasta 800 kilos con una mano. ¡Un tanque de la selva! Igual que vos, ' + userName + ', siempre con fuerza, che.'
    },
    {
        title: '¡Chitas rápidas!',
        text: 'El chita corre a 100 km/h en 3 segundos, pero solo por ratos cortos. ¡Un bólido felino! Vos, ' + userName + ', también arrancás a mil.'
    },
    {
        title: '¡Buitres olfativos!',
        text: 'Los buitres encuentran comida podrida oliendo a kilómetros. ¡Unos detectives del aire! Igual que vos, ' + userName + ', siempre al tanto, loco.'
    },
    {
        title: '¡Peces voladores!',
        text: 'Los peces voladores planean hasta 200 metros pa’ escapar de predadores. ¡Unos aviadores marinos! Vos, ' + userName + ', también volás alto, che.'
    },
    {
        title: '¡Hipopótamos pesados!',
        text: 'Un hipopótamo pesa hasta 4 toneladas y corre más rápido que un humano. ¡Un tanque con patas! Igual que vos, ' + userName + ', puro poder.'
    },
    {
        title: '¡Guacamayos coloridos!',
        text: 'Los guacamayos usan sus plumas brillantes pa’ impresionar y comunicarse. ¡Unos artistas del aire! Vos, ' + userName + ', también tenés tu brillo, loco.'
    },
    {
        title: '¡Rinocerontes blindados!',
        text: 'La piel de un rinoceronte tiene 3 cm de grosor y lo hace casi impenetrable. ¡Un tanque natural! Igual que vos, ' + userName + ', puro aguante.'
    },
    {
        title: '¡Cisnes fieles!',
        text: 'Los cisnes se emparejan de por vida y defienden a su pareja a picotazos. ¡Unos románticos bravos! Vos, ' + userName + ', también tenés ese corazón, che.'
    },
    {
        title: '¡Grillos cantores!',
        text: 'Los grillos hacen música frotando sus alas pa’ atraer pareja. ¡Unos serenateros! Igual que vos, ' + userName + ', siempre con onda.'
    },
    {
        title: '¡Armadillos bolita!',
        text: 'El armadillo de tres bandas se hace bolita pa’ protegerse. ¡Un ninja blindado! Vos, ' + userName + ', también sabés defenderte, loco.'
    },
    {
        title: '¡Suricatas guardianas!',
        text: 'Las suricatas tienen vigías que avisan al grupo si viene peligro. ¡Unas centinelas zarpadas! Igual que vos, ' + userName + ', siempre alerta.'
    },
    {
        title: '¡Tigres sigilosos!',
        text: 'Un tigre puede acechar en silencio y saltar 10 metros de una. ¡Un cazador ninja! Vos, ' + userName + ', también tenés ese toque sigiloso, che.'
    },
    {
        title: '¡Caballitos de mar papás!',
        text: 'Los caballitos de mar macho llevan los huevos en una bolsa hasta que nacen. ¡Unos padres copados! Igual que vos, ' + userName + ', siempre bancando.'
    },
    {
        title: '¡Bichos bola gigantes!',
        text: 'El isópodo gigante del océano profundo mide hasta 50 cm y se enrolla como pelota. ¡Un tanque submarino! Vos, ' + userName + ', también sos gros${userName === "Miguel" ? "o" : "a"}, loco.'
    },
    {
        title: '¡Águilas cazadoras!',
        text: 'Un águila real puede ver un conejo a 3 kilómetros y bajar en picada a atraparlo. ¡Un sniper del cielo! Igual que vos, ' + userName + ', siempre con visión zarpada.'
    }
];

    try {
        let embed;

        if (!args) {
            let availableFacts = randomFacts.filter(fact => fact.title !== ultimoDatoRandom?.title);
            if (availableFacts.length === 0) availableFacts = randomFacts; // Si no hay más, usamos todos
            const randomFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
            ultimoDatoRandom = randomFact; // Guardamos el dato usado

            embed = createEmbed('#FF1493', `💡 ¡Dato copado pa’ ${userName}!`, 
                'Che ' + userName + ', ¡posta que sí, loco! Preparate porque esto te va a volar la cabeza:\n\n' +
                randomFact.text + '\n\n' +
                '¿Qué te parece, ' + userName + '? Si querés más datos zarpados o algo específico, pedime nomás. ¡Sos tan gros' + (userName === "Miguel" ? "o" : "a") + ' que cualquier curiosidad queda corta al lado tuyo, che!')
                .setFooter({ text: `Con cariño, Oliver IA | Reacciona con ✅ o ❌`, iconURL: client.user.avatarURL() });
        } else {
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

            embed = createEmbed('#FF1493', `📜 Dato sobre "${args}" pa’ ${userName}`, 
                'Che ' + userName + ', acá va algo zarpado:\n\n' + reply + '\n\n' +
                '*Lo saqué de la web, posta.* ¡Sos una máquina pidiendo datos, loco! ¿Querés otro?')
                .setFooter({ text: `Con cariño, Oliver IA | Reacciona con ✅ o ❌`, iconURL: client.user.avatarURL() });
        }

        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error buscando "${args || 'dato random'}": ${error.message}`);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No pude encontrar nada${args ? ` sobre "${args}"` : ''}, ${userName}. ¿Probamos con otra cosa, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Clima
async function manejarClima(message, silent = false) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!clima') 
        ? message.content.slice(6).trim() 
        : message.content.slice(3).trim();

    if (!args) {
        const errorEmbed = createEmbed('#FF5555', '¡Pará, loco!', 
            `¡Decime una ciudad después de "!clima", ${userName}! Ejemplo: !clima Guayaquil`);
        if (!silent) await message.channel.send({ embeds: [errorEmbed] });
        return { description: errorEmbed.description };
    }

    const waitingEmbed = createEmbed('#FF1493', `⛅ Chequeando el clima, ${userName}...`, 
        `Aguantá que veo cómo está "${args}"...`);
    let waitingMessage;
    if (!silent) waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

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

        const embed = createEmbed('#FF1493', `⛅ Clima en ${city}, ${country}`, 
            `${temp}°C, ${desc}, ${vibe}.`);
        if (!silent && waitingMessage) await waitingMessage.edit({ embeds: [embed] });
        return { description: `${temp}°C, ${desc}, ${vibe}.` };
    } catch (error) {
        console.error(`Error en clima para "${args}": ${error.message}`);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No pude encontrar el clima de "${args}", ${userName}. ¿Seguro que existe esa ciudad, loco?`);
        if (!silent && waitingMessage) await waitingMessage.edit({ embeds: [errorEmbed] });
        return { description: errorEmbed.description };
    }
}

// Noticias
async function manejarNoticias(message, silent = false) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const isForTelegram = message.channel.type !== 'GUILD_TEXT';

    const waitingEmbed = createEmbed('#55FFFF', `📰 Buscando noticias, ${userName}...`, 
        `Aguantá que te traigo lo último${isForTelegram ? (userName === 'Miguel' ? ' de Ecuador' : ' de Argentina') : ' de Argentina y Ecuador'} al toque...`);
    let waitingMessage;
    if (!silent && !isForTelegram) {
        try {
            waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });
        } catch (error) {
            console.error(`Error enviando mensaje de espera: ${error.message}`);
        }
    }

    try {
        const apiKey = process.env.MEDIASTACK_API_KEY;
        if (!apiKey) throw new Error('Falta la clave de Mediastack en el .env, loco.');
        console.log(`Usando clave API: ${apiKey.substring(0, 4)}... (ocultada por seguridad)`);

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        console.log(`Fecha calculada: ${today}`);

        const fetchNews = async (country) => {
            let url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&countries=${country}&languages=es&limit=5&date=${today}&sort=published_desc`;
            console.log(`Pidiendo noticias de ${country} a: ${url}`);
            try {
                let response = await axios.get(url);
                console.log(`Respuesta cruda de ${country}: ${JSON.stringify(response.data, null, 2)}`);
                let articles = response.data.data || [];
                if (articles.length === 0) {
                    url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&countries=${country}&languages=es&limit=5&sort=published_desc`;
                    console.log(`Sin noticias de hoy para ${country}, probando sin fecha: ${url}`);
                    response = await axios.get(url);
                    articles = response.data.data || [];
                }
                return articles;
            } catch (error) {
                console.error(`Error al obtener noticias de ${country}: ${error.message}`);
                return [];
            }
        };

        const articlesAR = await fetchNews('ar');
        const articlesEC = await fetchNews('ec');

        let noticias;
        if (silent) {
            const relevantArticles = userName === 'Miguel' ? articlesEC : articlesAR;
            noticias = relevantArticles.length > 0 
                ? relevantArticles.slice(0, 3).map((article, index) => `${index + 1}. ${article.title || 'Sin título disponible'}`).join('\n')
                : `No encontré noticias de ${userName === 'Miguel' ? 'Ecuador' : 'Argentina'} hoy, loco.`;
        } else {
            const noticiasAR = articlesAR.length > 0 
                ? articlesAR.slice(0, 5).map((article, index) => `${index + 1}. **${article.title || 'Sin título disponible'}**`).join('\n')
                : 'No encontré noticias de Argentina hoy, loco.';
            const noticiasEC = articlesEC.length > 0 
                ? articlesEC.slice(0, 5).map((article, index) => `${index + 1}. **${article.title || 'Sin título disponible'}**`).join('\n')
                : 'No encontré noticias de Ecuador hoy, loco.';
            noticias = `**Argentina:**\n${noticiasAR}\n\n**Ecuador:**\n${noticiasEC}`;
        }

        const embed = createEmbed('#FFD700', `📰 Últimas Noticias (${today})`, noticias);
        const embedSize = JSON.stringify(embed).length;
        console.log(`Tamaño del embed: ${embedSize} caracteres`);
        if (embedSize > 6000) throw new Error(`El embed excede el límite de 6000 caracteres: ${embedSize}`);

        if (!silent && !isForTelegram) {
            if (waitingMessage) {
                await waitingMessage.edit({ embeds: [embed] });
                console.log(`Noticias enviadas al canal de Discord para ${userName}`);
            } else {
                await message.channel.send({ embeds: [embed] });
                console.log(`Noticias enviadas directamente al canal de Discord para ${userName}`);
            }
        }
        return embed;
    } catch (error) {
        console.error(`Error en manejarNoticias: ${error.message}`);
        const errorEmbed = createEmbed('#FF5555', '¡Qué quilombo!', 
            `No pude traer noticias copadas, ${userName}. Error: ${error.message}. ¿Probamos de nuevo, loco?`);
        if (!silent && !isForTelegram && waitingMessage) {
            await waitingMessage.edit({ embeds: [errorEmbed] });
        }
        return errorEmbed;
    }
}

async function obtenerDatoInteresante(userName) {

const randomFacts = [
    {
        title: '¡Gatos saltarines!',
        text: 'Los gatos pueden saltar hasta 6 veces su longitud en un solo brinco. ¡Unos atletas felinos! Igual que vos, ' + userName + ', siempre dando el salto zarpado, che.'
    },
    {
        title: '¡Abejas bailarinas!',
        text: 'Las abejas hacen un baile en forma de 8 pa’ decirle a sus compañeras dónde está la comida. ¡Unas coreógrafas del aire! Vos también tenés ese ritmo, ' + userName + ', pa’ romperla toda.'
    },
    {
        title: '¡Elefantes memoriosos!',
        text: 'Los elefantes nunca olvidan dónde dejaron el agua, incluso años después. ¡Una memoria bestial! Igual que vos, ' + userName + ', que no te perdés ni un asado, loco.'
    },
    {
        title: '¡Canguros boxeadores!',
        text: 'Los canguros macho se dan piñas pa’ impresionar a las hembras. ¡Unos campeones del ring! Vos, ' + userName + ', también la rompés con estilo, che.'
    },
    {
        title: '¡Lobos cantores!',
        text: 'Los lobos aúllan pa’ hablarse entre sí a kilómetros de distancia. ¡Unos rockeros de la naturaleza! Igual que vos, ' + userName + ', siempre con voz fuerte, posta.'
    },
    {
        title: '¡Tiburones dormilones!',
        text: 'Algunos tiburones duermen con los ojos abiertos y nadando pa’ no hundirse. ¡Unos genios multitasking! Como vos, ' + userName + ', que hacés todo al toque.'
    },
    {
        title: '¡Ranas venenosas!',
        text: 'La rana dardo venenoso tiene tanto veneno en su piel que puede matar a 10 personas con un toque. ¡Una mini asesina! Igual, ' + userName + ', vos matás con tu onda.'
    },
    {
        title: '¡Camaleones artistas!',
        text: 'Los camaleones cambian de color no solo pa’ camuflarse, sino también pa’ mostrar su humor. ¡Unos cracks expresivos! Vos, ' + userName + ', también tenés ese flow, che.'
    },
    {
        title: '¡Delfines charlatanes!',
        text: 'Los delfines tienen nombres propios que se silban entre ellos. ¡Unos capos de la comunicación! Igual que vos, ' + userName + ', siempre al pie del cañón.'
    },
    {
        title: '¡Murciélagos ecológicos!',
        text: 'Un murciélago puede comer hasta 1.000 mosquitos en una noche. ¡Un héroe nocturno! Vos, ' + userName + ', también limpiás la cancha, loco.'
    },
    {
        title: '¡Arañas ingenieras!',
        text: 'Las arañas tejen telas más fuertes que el acero, peso por peso. ¡Unas arquitectas zarpadas! Igual que vos, ' + userName + ', siempre construyendo algo grosso.'
    },
    {
        title: '¡Koalas vagos!',
        text: 'Los koalas duermen hasta 22 horas al día pa’ ahorrar energía. ¡Unos fiacas profesionales! Vos, ' + userName + ', sos puro motor en comparación, che.'
    },
    {
        title: '¡Leones rugidores!',
        text: 'El rugido de un león se escucha a 8 kilómetros de distancia. ¡Un parlante natural! Igual que vos, ' + userName + ', que hacés temblar el barrio.'
    },
    {
        title: '¡Perezosos lentos!',
        text: 'Un perezoso tarda un mes en digerir una hoja. ¡El rey de la pachorra! Vos, ' + userName + ', zumbás mucho más rápido, loco.'
    },
    {
        title: '¡Avestruces velocistas!',
        text: 'Un avestruz corre a 70 km/h, más rápido que un caballo. ¡Un bólido con plumas! Igual que vos, ' + userName + ', siempre a full gas.'
    },
    {
        title: '¡Ballenas cantantes!',
        text: 'Las ballenas jorobadas cantan canciones que duran horas y se copian entre ellas. ¡Unas rockstars del mar! Vos, ' + userName + ', también tenés tu hit, che.'
    },
    {
        title: '¡Cocodrilos llorones!',
        text: 'Los cocodrilos lloran mientras comen, pero no de tristeza, es pa’ lubricar los ojos. ¡Unos actores dramáticos! Igual que vos, ' + userName + ', siempre con onda.'
    },
    {
        title: '¡Hormigas fuertes!',
        text: 'Una hormiga puede cargar 50 veces su peso. ¡Una forzuda diminuta! Vos, ' + userName + ', también levantás lo que sea, loco.'
    },
    {
        title: '¡Búhos giratorios!',
        text: 'Los búhos pueden girar la cabeza 270 grados sin moverse. ¡Unos contorsionistas! Igual que vos, ' + userName + ', siempre mirando pa’ todos lados.'
    },
    {
        title: '¡Pavos reales coquetos!',
        text: 'El pavo real usa su cola pa’ conquistar, pero no vuela bien por el peso. ¡Un galán con estilo! Vos, ' + userName + ', también tenés tu charme, che.'
    },
    {
        title: '¡Tortugas viajeras!',
        text: 'Las tortugas marinas recorren miles de kilómetros pa’ volver a su playa natal. ¡Unas GPS vivientes! Igual que vos, ' + userName + ', siempre encontrás el camino.'
    },
    {
        title: '¡Zorros astutos!',
        text: 'Los zorros árticos cazan escuchando bajo la nieve y saltan pa’ atrapar presas. ¡Unos ninjas blancos! Vos, ' + userName + ', también tenés ese olfato, loco.'
    },
    {
        title: '¡Flamencos equilibristas!',
        text: 'Los flamencos duermen parados en una pata pa’ no gastar energía. ¡Unos cracks del balance! Igual que vos, ' + userName + ', siempre firme.'
    },
    {
        title: '¡Serpientes mudadoras!',
        text: 'Las serpientes cambian de piel hasta 4 veces al año pa’ crecer. ¡Unas reinas del makeover! Vos, ' + userName + ', también te renovás siempre, che.'
    },
    {
        title: '¡Orcas estrategas!',
        text: 'Las orcas cazan en equipo y usan olas pa’ tirar focas al agua. ¡Unas maestras del teamwork! Igual que vos, ' + userName + ', siempre jugando en equipo.'
    },
    {
        title: '¡Ciervos cornudos!',
        text: 'Los ciervos pierden y regeneran sus cuernos cada año. ¡Unos renovadores natos! Vos, ' + userName + ', también volvés más fuerte, loco.'
    },
    {
        title: '¡Pandas glotones!',
        text: 'Un panda come hasta 12 kilos de bambú al día pa’ sobrevivir. ¡Un campeón del morfi! Igual que vos, ' + userName + ', con el asado.'
    },
    {
        title: '¡Halcones veloces!',
        text: 'El halcón peregrino baja en picada a 300 km/h pa’ cazar. ¡Un misil con plumas! Vos, ' + userName + ', también zumbás a mil, che.'
    },
    {
        title: '¡Medusas inmortales!',
        text: 'La medusa *Turritopsis* puede volver a su estado juvenil después de vieja. ¡Una eterna joven! Igual que vos, ' + userName + ', siempre con pilas.'
    },
    {
        title: '¡Peces payaso hogareños!',
        text: 'Los peces payaso viven entre anémonas venenosas pa’ protegerse. ¡Unos cracks del barrio! Vos, ' + userName + ', también tenés tu lugar, loco.'
    },
    {
        title: '¡Cucarachas sobrevivientes!',
        text: 'Una cucaracha puede vivir semanas sin cabeza hasta que se muere de hambre. ¡Unas duras posta! Igual que vos, ' + userName + ', puro aguante.'
    },
    {
        title: '¡Lémures fiesteros!',
        text: 'Los lémures de Madagascar se juntan en grupos pa’ cantar y bailar. ¡Unos locos del vacile! Vos, ' + userName + ', también armás la joda, che.'
    },
    {
        title: '¡Pingüinos nadadores!',
        text: 'Los pingüinos pueden nadar a 36 km/h pa’ escapar de depredadores. ¡Unos torpedos con smoking! Igual que vos, ' + userName + ', siempre escapando con estilo.'
    },
    {
        title: '¡Jirafas altas!',
        text: 'Las jirafas tienen el cuello más largo del reino animal, pero solo 7 vértebras como nosotros. ¡Unas cracks del estirón! Vos, ' + userName + ', también destacás.'
    },
    {
        title: '¡Osos dormilones!',
        text: 'Los osos polares hibernan hasta 8 meses sin comer ni moverse mucho. ¡Unos fiacas zarpados! Vos, ' + userName + ', sos puro movimiento, loco.'
    },
    {
        title: '¡Gorilas fuertes!',
        text: 'Un gorila puede levantar hasta 800 kilos con una mano. ¡Un tanque de la selva! Igual que vos, ' + userName + ', siempre con fuerza, che.'
    },
    {
        title: '¡Chitas rápidas!',
        text: 'El chita corre a 100 km/h en 3 segundos, pero solo por ratos cortos. ¡Un bólido felino! Vos, ' + userName + ', también arrancás a mil.'
    },
    {
        title: '¡Buitres olfativos!',
        text: 'Los buitres encuentran comida podrida oliendo a kilómetros. ¡Unos detectives del aire! Igual que vos, ' + userName + ', siempre al tanto, loco.'
    },
    {
        title: '¡Peces voladores!',
        text: 'Los peces voladores planean hasta 200 metros pa’ escapar de predadores. ¡Unos aviadores marinos! Vos, ' + userName + ', también volás alto, che.'
    },
    {
        title: '¡Hipopótamos pesados!',
        text: 'Un hipopótamo pesa hasta 4 toneladas y corre más rápido que un humano. ¡Un tanque con patas! Igual que vos, ' + userName + ', puro poder.'
    },
    {
        title: '¡Guacamayos coloridos!',
        text: 'Los guacamayos usan sus plumas brillantes pa’ impresionar y comunicarse. ¡Unos artistas del aire! Vos, ' + userName + ', también tenés tu brillo, loco.'
    },
    {
        title: '¡Rinocerontes blindados!',
        text: 'La piel de un rinoceronte tiene 3 cm de grosor y lo hace casi impenetrable. ¡Un tanque natural! Igual que vos, ' + userName + ', puro aguante.'
    },
    {
        title: '¡Cisnes fieles!',
        text: 'Los cisnes se emparejan de por vida y defienden a su pareja a picotazos. ¡Unos románticos bravos! Vos, ' + userName + ', también tenés ese corazón, che.'
    },
    {
        title: '¡Grillos cantores!',
        text: 'Los grillos hacen música frotando sus alas pa’ atraer pareja. ¡Unos serenateros! Igual que vos, ' + userName + ', siempre con onda.'
    },
    {
        title: '¡Armadillos bolita!',
        text: 'El armadillo de tres bandas se hace bolita pa’ protegerse. ¡Un ninja blindado! Vos, ' + userName + ', también sabés defenderte, loco.'
    },
    {
        title: '¡Suricatas guardianas!',
        text: 'Las suricatas tienen vigías que avisan al grupo si viene peligro. ¡Unas centinelas zarpadas! Igual que vos, ' + userName + ', siempre alerta.'
    },
    {
        title: '¡Tigres sigilosos!',
        text: 'Un tigre puede acechar en silencio y saltar 10 metros de una. ¡Un cazador ninja! Vos, ' + userName + ', también tenés ese toque sigiloso, che.'
    },
    {
        title: '¡Caballitos de mar papás!',
        text: 'Los caballitos de mar macho llevan los huevos en una bolsa hasta que nacen. ¡Unos padres copados! Igual que vos, ' + userName + ', siempre bancando.'
    },
    {
        title: '¡Bichos bola gigantes!',
        text: 'El isópodo gigante del océano profundo mide hasta 50 cm y se enrolla como pelota. ¡Un tanque submarino! Vos, ' + userName + ', también sos gros${userName === "Miguel" ? "o" : "a"}, loco.'
    },
    {
        title: '¡Águilas cazadoras!',
        text: 'Un águila real puede ver un conejo a 3 kilómetros y bajar en picada a atraparlo. ¡Un sniper del cielo! Igual que vos, ' + userName + ', siempre con visión zarpada.'
    }
];
    const availableFacts = randomFacts.filter(fact => fact.title !== ultimoDatoRandom?.title);
    const randomFact = availableFacts.length > 0 ? availableFacts[Math.floor(Math.random() * availableFacts.length)] : randomFacts[Math.floor(Math.random() * randomFacts.length)];
    ultimoDatoRandom = randomFact;

    return `${randomFact.title}\n${randomFact.text}`;
}

// Wiki
async function manejarWiki(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.toLowerCase().startsWith('!wiki') 
        ? message.content.slice(5).trim() 
        : message.content.slice(3).trim();

    if (!args) {
        return sendError(message.channel, `¡Tirame algo después de "!wiki", ${userName}! Ejemplo: !wiki tango`);
    }

    const waitingEmbed = createEmbed('#FF1493', `📖 Buscando en Wiki, ${userName}...`, 
        `Aguantá que te traigo info de "${args}"...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args)}`;
        const response = await axios.get(url);
        const data = response.data;

        const summary = data.extract.length > 200 
            ? `${data.extract.slice(0, 197)}...` 
            : data.extract;

        const embed = createEmbed('#FF1493', `📖 Sobre "${data.title}"`, 
            `${summary}\n*Sacado de Wikipedia, posta.*`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error en wiki para "${args}": ${error.message}`);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No encontré nada en Wikipedia sobre "${args}", ${userName}. ¿Probamos otra cosa, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Traductor
async function manejarTraduci(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    console.log(`Mensaje recibido en manejarTraduci: "${message.content}"`);
    const args = message.content.toLowerCase().startsWith('!traduci') 
        ? message.content.slice(8).trim().split(' a ') 
        : message.content.slice(3).trim().split(' a ');
    const text = args[0].trim();
    console.log(`Texto a traducir: "${text}"`);

    if (args.length < 2) {
        return sendError(message.channel, `¡Escribí algo como "!traducí hola a inglés", ${userName}!`);
    }

    const targetLang = args[1].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const waitingEmbed = createEmbed('#FF1493', `✍️ Traduciendo, ${userName}...`, 
        `Aguantá que traduzco "${text}" a ${targetLang}...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const langCode = langMap[targetLang];

        if (!langCode) {
            throw new Error(`No sé traducir a "${targetLang}", ${userName}. Probá con "inglés", "ruso", "francés", etc.`);
        }

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
        console.log(`Pidiendo traducción a Google Translate: ${url}`);
        const response = await axios.get(url);

        console.log('Respuesta de Google Translate:', JSON.stringify(response.data, null, 2));

        const translated = response.data[0][0][0];

        if (!translated || translated.toLowerCase() === text.toLowerCase()) {
            throw new Error(`¡Qué boludo! La traducción salió igual que el original: "${translated}". ¿La API está rota o qué?`);
        }

        const embed = createEmbed('#FF1493', `✅ Traducción a ${targetLang.charAt(0).toUpperCase() + targetLang.slice(1)}`, 
            `"${text}" → **${translated}**\n*Traducido con onda por Oliver IA, che.*`);
        await waitingMessage.edit({ embeds: [embed] });
    } catch (error) {
        console.error(`Error traduciendo "${text}" a "${targetLang}": ${error.message}`);
        if (error.response) {
            console.error(`Respuesta de la API: ${JSON.stringify(error.response.data)}`);
        }
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', `${error.message}`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

async function manejarWatchTogether(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        const embed = createEmbed('#FF1493', `¡Ey, ${userName}!`, 
            'Tenés que estar en un canal de voz, ¡sumate a uno, loco!');
        return await message.channel.send({ embeds: [embed] });
    }

    try {
        const invite = await discordTogether.createTogetherCode(voiceChannel.id, 'youtube');
        const inviteUrl = `https://discord.com/invite/${invite.code}`;
        const embed = createEmbed('#FF1493', `🎥 ¡Watch Together, ${userName}!`, 
            `¡Listo, ${userName === 'Belen' ? 'genia' : 'genio'}! Hacé clic: [enlace](${inviteUrl})\n¡A romperla con videos, ${userName === 'Belen' ? 'loca' : 'loco'}!`);
        await message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Error con discord-together: ${error.message}`);
        const embed = createEmbed('#FF1493', `¡Ups, ${userName}!`, 
            `No pude arrancar Watch Together, loco. Error: ${error.message}\nHacélo manual: "Actividades" > "Watch Together".`);
        await message.channel.send({ embeds: [embed] });
    }
}

// lenguajes
async function listarIdiomas(message) {
    const idiomas = Object.keys(langMap).sort();
    const maxLength = 4000;
    let descripcionActual = '';
    const embeds = [];
    
    let embed = new EmbedBuilder()
        .setTitle('Idiomas disponibles para traducir')
        .setColor('#FF1493')
        .setFooter({ text: 'Oliver IA - Traducción con onda' });

    for (const idioma of idiomas) {
        const adicion = `${idioma}, `;
        if (descripcionActual.length + adicion.length > maxLength) {
            embed.setDescription(descripcionActual.slice(0, -2));
            embeds.push(embed);
            
            embed = new EmbedBuilder()
                .setTitle('Idiomas disponibles para traducir (continuación)')
                .setColor('#FF1493')
                .setFooter({ text: 'Oliver IA - Traducción con onda' });
            descripcionActual = '';
        }
        descripcionActual += adicion;
    }
    
    if (descripcionActual.length > 0) {
        embed.setDescription(descripcionActual.slice(0, -2));
        embeds.push(embed);
    }
    
    for (const embed of embeds) {
        await message.channel.send({ embeds: [embed] });
    }
}

// Milagros
async function manejarMilagros(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const maxLength = 4000; 

    const translationsArray = Object.entries(milagrosTranslations).map(([lang, translation]) => 
        `${lang.charAt(0).toUpperCase() + lang.slice(1)}: **${translation}**`
    );

    let description = `¡Hola, ${userName}! Aquí tenés "Milagros" en diferentes idiomas:\n\n`;
    const embeds = [];

    for (const line of translationsArray) {
        const newDescription = description + line + '\n';
        if (newDescription.length > maxLength) {
            embeds.push(await createEmbed('#FF1493', `Milagros en otros idiomas (Parte ${embeds.length + 1})`, description.trim()));
            description = line + '\n';
        } else {
            description = newDescription;
        }
    }

    if (description.length > 41) { 
        embeds.push(await createEmbed('#FF1493', `Milagros en otros idiomas (Parte ${embeds.length + 1})`, description.trim()));
    }

    for (const embed of embeds) {
        try {
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error al enviar embed de Milagros:', error);
            await message.channel.send('¡Uy, algo falló al mostrar las traducciones, loco!');
        }
    }
}

// Eventos de música con Erela.js
manager.on('nodeConnect', node => {
    console.log(`Nodo ${node.options.identifier} conectado.`);
});

manager.on('nodeError', (node, error) => {
    console.error(`Error en nodo ${node.options.identifier}: ${error.message}`);
    console.log('Datos completos del error:', JSON.stringify(error, null, 2));
});


manager.on('queueEnd', async player => {
    const channel = client.channels.cache.get(player.textChannel);
    const guildId = player.guild;
    const autoplay = dataStore.musicSessions[guildId]?.autoplay || false;
    const userName = player.queue.current?.requester?.id === OWNER_ID ? 'Miguel' : 'Belén';

    console.log(`Cola terminó en guild ${guildId}. Autoplay: ${autoplay}, Tracks en cola: ${player.queue.size}`);

    if (autoplay && channel) {
        try {
            let trackIdentifier = player.queue.current?.identifier || player.queue.previous?.identifier;
            if (!trackIdentifier) {
                console.log('No hay identifier disponible para autoplay.');
                throw new Error('Sin pistas recientes para continuar.');
            }

            const related = await manager.search(`related:${trackIdentifier}`, client.user);
            console.log(`Búsqueda relacionada: ${related.loadType}, tracks: ${related.tracks.length}`);

            if (related.tracks.length > 0) {
                const nextTrack = related.tracks[0];
                player.queue.add(nextTrack);
                player.play();
                console.log(`Autoplay agregó: ${nextTrack.title}`);
                const embed = createEmbed('#FF1493', '🎵 Autoplay en acción!', 
                    `Añadí **${nextTrack.title}**, ${userName}. ¡Seguimos!`);
                await channel.send({ embeds: [embed] });
            } else {
                throw new Error('No se encontraron temas relacionados.');
            }
        } catch (error) {
            console.error(`Error en autoplay: ${error.message}`);
            const embed = createEmbed('#FF1493', '⚠️ Autoplay pausado', 
                `No encontré más temas, ${userName}. El bot sigue en el canal.`);
            await channel.send({ embeds: [embed] });
        }
    } else if (channel) {
        console.log('Cola terminó sin autoplay.');
        const embed = createEmbed('#FF1493', '🏁 Cola terminada', 
            `No hay más temas, ${userName}. ¡Agregá algo con !play!`);
        await channel.send({ embeds: [embed] });
    }
});

manager.on('trackStart', async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) {
        console.error(`Canal no encontrado: ${player.textChannel}`);
        return;
    }

    const currentTrack = player.get('currentTrack');
    if (currentTrack === track.uri) {
        console.log(`Pista ${track.title} ya está en reproducción, ignorando trackStart. URI: ${track.uri}`);
        return;
    }
    console.log(`trackStart para ${track.title}, URI: ${track.uri}, seteando como pista actual.`);
    player.set('currentTrack', track.uri);
    player.set('trackEnded', false);

    console.log(`Iniciando pista: ${track.title} en guild ${player.guild}, queue.size=${player.queue.size}`);

    const durationMs = track.duration;
    const durationSeconds = Math.floor(durationMs / 1000);
    const durationFormatted = `${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')}`;

    let thumbnail = track.thumbnail;
    if (!thumbnail && track.uri && track.uri.includes('spotify')) {
        console.log(`Thumbnail no disponible, intentando con Spotify para ${track.uri}`);
    }
    if (!thumbnail && track.identifier) {
        thumbnail = `https://img.youtube.com/vi/${track.identifier}/hqdefault.jpg`;
    }
    if (!thumbnail) {
        thumbnail = 'https://i.imgur.com/defaultThumbnail.png';
        console.log(`Sin thumbnail disponible para ${track.title}, usando placeholder.`);
    }
    console.log(`Thumbnail usado para ${track.title}: ${thumbnail}`);

    const updateBossBar = () => {
        const positionMs = player.position;
        const positionSeconds = Math.floor(positionMs / 1000);
        const positionFormatted = `${Math.floor(positionSeconds / 60)}:${(positionSeconds % 60).toString().padStart(2, '0')}`;
        const totalBars = 20;
        const progress = Math.min(positionMs / durationMs, 1);
        const filledBars = Math.round(progress * totalBars);
        const emptyBars = totalBars - filledBars;
        const bossBar = '▬'.repeat(filledBars) + '🔘' + '▬'.repeat(emptyBars);

        const embed = createEmbed('#FF1493', '▶️ Sonando ahora',
            `**${track.title}**\n⏳ Duración: ${durationFormatted}\n📊 Progreso: ${bossBar} ${positionFormatted} / ${durationFormatted}`)
            .setThumbnail(thumbnail);
        return embed;
    };

    try {
        const embed = updateBossBar();
        const progressMessage = await channel.send({ embeds: [embed] });
        player.set('progressMessage', progressMessage);

        const intervalo = setInterval(() => {
            const updatedEmbed = updateBossBar();
            progressMessage.edit({ embeds: [updatedEmbed] }).catch(err => {
                console.error('Error editando boss bar:', err);
                clearInterval(intervalo);
            });
        }, 5000);

        player.set('progressInterval', intervalo);
    } catch (error) {
        console.error(`Error en trackStart para ${track.title}: ${error.message}`);
    }
});

manager.on('trackEnd', (player, track) => {
    console.log(`trackEnd disparado para: ${track.title}, guild: ${player.guild}, queue.size: ${player.queue.size}, URI: ${track.uri}`);
    const intervalo = player.get('progressInterval');
    const progressMessage = player.get('progressMessage');
    const userName = track.requester.id === OWNER_ID ? 'Miguel' : 'Belén';
    const currentTrackUri = player.get('currentTrack');

    if (player.get('trackEnded') || (currentTrackUri && currentTrackUri !== track.uri)) {
        console.log(`Ignorando trackEnd para ${track.title}. Ya terminó o no es la pista actual (current: ${currentTrackUri}).`);
        return;
    }
    console.log(`Procesando trackEnd para ${track.title}, marcando como terminado.`);
    player.set('trackEnded', true);

    // Actualizamos el embed al 100%
    if (progressMessage && track) {
        const durationStr = `${Math.floor(track.duration / 60000)}:${((track.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}`;
        const bossBar = crearBossBar(track.duration, track.duration);

        const finalEmbed = createEmbed('#FF1493', `🎶 Tema terminado pa’ ${userName}`, '¡Ya fue, che!')
            .addFields(
                { name: '⏹️ Terminado', value: `**${track.title}**`, inline: false },
                { name: '⏳ Duración', value: durationStr, inline: true },
                { name: '📊 Progreso', value: `${bossBar} ${durationStr} / ${durationStr}`, inline: true }
            )
            .setThumbnail(track.thumbnail || 'https://i.imgur.com/defaultThumbnail.png')
            .setFooter({ text: `Oliver IA - Música con onda | Pedido por ${userName}`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        progressMessage.edit({ embeds: [finalEmbed] }).catch(err => console.error('Error editando embed final:', err));
    }

    if (intervalo) {
        clearInterval(intervalo);
        player.set('progressInterval', null);
    }

    player.set('progressMessage', null);

    const guildId = player.guild;
    dataStore.musicSessions[guildId] = dataStore.musicSessions[guildId] || {};
    dataStore.musicSessions[guildId].history = dataStore.musicSessions[guildId].history || [];
    if (track) {
        dataStore.musicSessions[guildId].history.unshift(track);
        if (dataStore.musicSessions[guildId].history.length > 50) {
            dataStore.musicSessions[guildId].history.pop();
        }
        dataStoreModified = true;
    }
});

async function manejarJugar(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    console.log(`Iniciando juego para ${userName}`);

    const numeroSecreto = Math.floor(Math.random() * 10) + 1;
    let intentos = 0;
    const maxIntentos = 5;

    const inicioEmbed = createEmbed('#FF1493', `¡A jugar, ${userName}!`, 
        'Adiviná un número entre 1 y 10, loco. Tenés 5 intentos. ¡Mandame tu primer número!');
    await message.channel.send({ embeds: [inicioEmbed] });

    const filter = m => m.author.id === message.author.id && !isNaN(m.content) && m.content >= 1 && m.content <= 10;
    const collector = message.channel.createMessageCollector({ filter, max: maxIntentos, time: 60000 });

    collector.on('collect', async m => {
        intentos++;
        const guess = parseInt(m.content);

        if (guess === numeroSecreto) {
            const winEmbed = createEmbed('#FF1493', `¡Ganaste, ${userName}!`, 
                `¡Lo clavaste en ${intentos} intentos, loco! El número era ${numeroSecreto}. ¿Querés otra ronda?`);
            await message.channel.send({ embeds: [winEmbed] });
            collector.stop();
        } else if (guess < numeroSecreto) {
            const lowEmbed = createEmbed('#FF1493', `¡Nah, ${userName}!`, 
                `Más alto, loco. Te quedan ${maxIntentos - intentos} intentos.`);
            await message.channel.send({ embeds: [lowEmbed] });
        } else {
            const highEmbed = createEmbed('#FF1493', `¡No, ${userName}!`, 
                `Más bajo, loco. Te quedan ${maxIntentos - intentos} intentos.`);
            await message.channel.send({ embeds: [highEmbed] });
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            const timeoutEmbed = createEmbed('#FF1493', `¡Tiempo, ${userName}!`, 
                `Se acabó el reloj, loco. El número era ${numeroSecreto}. ¿Otra ronda?`);
            message.channel.send({ embeds: [timeoutEmbed] });
        } else if (collected.size < maxIntentos) {
            return;
        } else {
            const loseEmbed = createEmbed('#FF1493', `¡Perdiste, ${userName}!`, 
                `Te quedaste sin intentos, loco. El número era ${numeroSecreto}. ¿Querés revancha?`);
            message.channel.send({ embeds: [loseEmbed] });
        }
    });
}

// Comandos
async function manejarCommand(message, silent = false) {
    const content = message.content.toLowerCase();
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    
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
        return;
    }  
    else if (content === '!chiste') {
        await manejarChiste(message);
        return;
    }
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
        return;
    } 
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
    else if (content.startsWith('!traduci')) {
        console.log(`Enviando a manejarTraduci: "${message.content}"`);
        await manejarTraduci(message);
    }
    else if (content === '!eliminar') {
        await message.channel.send(`¡Uy, ${userName}! Me voy a eliminar en...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await message.channel.send('3...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await message.channel.send('2...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await message.channel.send('1...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await message.channel.send('¡Nah, era joda! Acá sigo, más vivo que nunca. 😜');
        return;
    }
    else if (content === '!trivia' || content === '!tc') {
        await manejarTrivia(message);
    } 
    else if (content === '!meme') {
        const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
        try {
            const API_KEY = '05o0BdpN9d0PCHOPoP63morLbU6wuYyk';
            const response = await axios.get(`https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}&tag=meme+español&rating=pg-13`);
    
            if (!response.data || !response.data.data?.images?.original?.url) {
                throw new Error('No encontré un meme en Giphy, loco.');
            }
    
            const gifUrl = response.data.data.images.original.url;
            let gifTitle = response.data.data.title || 'Un meme sin título, loco';
    
            gifTitle = gifTitle.replace(/ by .*$/, '');
            gifTitle = gifTitle.replace(/GIF$/i, '').trim();
            gifTitle = gifTitle
                .replace(/Spanish/i, 'Español')
                .replace(/Funny/i, 'Gracioso')
                .replace(/Reaction/i, 'Reacción')
                .replace(/Cat/i, 'Gato')
                .replace(/Dog/i, 'Perro')
                .replace(/Dance/i, 'Baile')
                .replace(/Fail/i, 'Fallo')
                .replace(/Uf/i, '¡Uff!');
    
            const memeEmbed = createEmbed('#FF1493', `¡Meme pa’ vos, ${userName}!`, 
                `¡Tomá este meme bien zarpado, loco! ¿Qué te parece?\n**${gifTitle}**`)
                .setImage(gifUrl);
            await message.channel.send({ embeds: [memeEmbed] });
    
            const preguntasMeme = [
                '¿Qué meme mandarías vos pa’ responderle a este, loco?',
                '¿En qué situación de tu vida usarías este meme, posta?',
                '¿Qué amigo tuyo se reiría a lo loco con esto?',
                '¿Qué le dirías al que hizo este meme si lo cruzás en la calle?',
                '¿Este meme te pega más pa’ un asado o pa’ un bondi aburrido?',
                '¿Qué título argento le pondrías vos a este meme?',
                '¿Qué cara pusiste cuando viste este meme, loco?',
                '¿Qué harías si este meme se hace viral en tu grupo de WhatsApp?',
                '¿Este meme te representa un lunes o un viernes a la noche?',
                '¿Qué comida argenta le va perfecto a este meme pa’ compartirlo?'
            ];
    
            const pregunta = preguntasMeme[Math.floor(Math.random() * preguntasMeme.length)];
            const preguntaEmbed = createEmbed('#FF1493', `¡Eh, ${userName}, una yapa!`, 
                `${pregunta} ¡Contame al toque, loco!`);
            await message.channel.send({ embeds: [preguntaEmbed] });
        } catch (error) {
            console.error(`Error al buscar meme: ${error.message}`);
            const errorEmbed = createEmbed('#FF1493', `¡Qué quilombo, ${userName}!`, 
                `No pude traer un meme, loco. Algo falló: ${error.message}. ¿Probamos de nuevo, dale?`);
            await message.channel.send({ embeds: [errorEmbed] });
        }
    }
    else if (content === '!milagros') {
        await manejarMilagros(message);
    } 
    else if (content.startsWith('!jugar')) {
        await manejarJugar(message);
    }
    else if (content === '!pregunta' || content === '!pr') {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (preguntasDisponibles.length === 0) {
        preguntasDisponibles = [...preguntas];
        shuffle(preguntasDisponibles);
        console.log('Preguntas recargadas y mezcladas');
    }

    const pregunta = preguntasDisponibles.pop();
    const preguntaEmbed = createEmbed('#FF1493', `¡Pregunta pa’ vos, ${userName}!`, 
        `${pregunta} ¡Contame, loco, qué pensás!`);
    await message.channel.send({ embeds: [preguntaEmbed] });
    }
    else if (content.startsWith('!avatar') || content.startsWith('!av')) {
        await manejarAvatar(message);
    }
    else if (content.startsWith('!ppt')) {
        if (message.mentions.users.size > 0) {
            await manejarPPTPersona(message);
        } else {
            await manejarPPTBot(message);
        }
    }
    else if (content.startsWith('!recordatorio') || content.startsWith('!rec')) {
        await manejarRecordatorio(message);
    }
    else if (content === '!misrecordatorios' || content === '!mr') {
        await manejarMisRecordatorios(message);
    }  
    else if (content.startsWith('!cancelarrecordatorio') || content.startsWith('!cr')) {
        await manejarCancelarRecordatorio(message);
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
    else if (content === '!rankingppm' || content === '!rppm') {
        await manejarRankingPPM(message);
    } 
    else if (content.startsWith('!play') || content.startsWith('!pl')) {
        const args = message.content.slice(content.startsWith('!play') ? 5 : 3).trim().split(/ +/);
        console.log(`Argumentos extraídos para !play: ${args}`);
        await manejarPlay(message, args);
        isPlayingMusic = true; 
        autosavePausedByMusic = true;
        console.log('Música arrancó, autosave pausado.');
    }
    else if (content === '!pause' || content === '!pa') {
        await manejarPause(message);
    } 
    else if (content === '!skip' || content === '!sk') {
        await manejarSkip(message);
    } 
    else if (content === '!shuffle' || content === '!sh') {
        await manejarShuffle(message);
    }
    else if (content === '!stop' || content === '!st') {
        await manejarStop(message);
        isPlayingMusic = false;
        autosavePausedByMusic = false; 
        console.log('Música parada, autosave reanudado.');
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
    else if (content.startsWith('!lyrics') || content.startsWith('!ly')) {
        await manejarLyrics(message);
    }
    else if (content === '!adivinanzas' || content === '!ad') {
        await manejarAdivinanza(message);
    }  
    else if (content === '!watchtogether' || content === '!wt') {
        await manejarWatchTogether(message);
    }
    else if (content.startsWith('!accion')) {
        await manejarAccion(message);
    }
    else if (content.startsWith('!dato') || content.startsWith('!dt')) {
        await manejarDato(message);
    } 
    else if (content.startsWith('!clima')) {
        return await manejarClima(message, silent);
    } 
    else if (content === '!noticias') {
        return await manejarNoticias(message, silent);
    }
    else if (content.startsWith('!wiki')) {
        await manejarWiki(message);
    }
    else if (content.startsWith('!ansiedad') || content.startsWith('!an')) {
        await manejarAnsiedad(message);
    }
    else if (content === '!lenguajes') {
        await listarIdiomas(message);
    }
    else if (content.startsWith('!miguel')) {
        await manejarMiguel(message);
        return;
    }
}

client.on('messageCreate', async (message) => {
        
    if (!message.author || !message.content || typeof message.content !== 'string') {
        return;
    }

    if (message.author.bot && message.author.username !== 'IFTTT') {
        return;
    }

    const userName = message.author.id === OWNER_ID ? 'Miguel' : (message.author.id === ALLOWED_USER_ID ? 'Belén' : 'Un desconocido');
    const content = message.content.trim().toLowerCase();

    const jefeRoleId = '1154946840454762496';
    const jefaRoleId = '1139744529428271187';
    const hasJefeMention = content.includes(`<@&${jefeRoleId}>`);
    const hasJefaMention = content.includes(`<@&${jefaRoleId}>`);

    if (hasJefeMention || hasJefaMention) {
        console.log(`Detectado mensaje IFTTT con mención: "${content}"`);
        const esJefe = hasJefeMention;
        const userId = esJefe ? ALLOWED_USER_ID : OWNER_ID;
        const targetName = esJefe ? 'Belén' : 'Miguel';
        const canalGeneralId = '1343749554905940058';
        const canalMiguel = '1351976159914754129';
        const canalBelen = '1351975268654252123';
        const canalGeneral = client.channels.cache.get(canalGeneralId);
        const canalRecordatorios = client.channels.cache.get(targetName === 'Miguel' ? canalMiguel : canalBelen);

        if (!canalGeneral || !canalRecordatorios) {
            console.error(`No se encontró el canal general (ID: ${canalGeneralId}) o el canal de recordatorios (ID: ${targetName === 'Miguel' ? canalMiguel : canalBelen})`);
            return;
        }

        const horaEcuador = new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
        const horaArgentina = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

        const processEvent = async (isArrival) => {
            console.log(`Procesando ${isArrival ? 'llegada' : 'salida'} de ${targetName}`);
            try {
                await message.delete();
                console.log(`Mensaje de IFTTT borrado: "${content}"`);
            } catch (error) {
                console.error(`No pude borrar el mensaje: ${error.message}`);
            }

            const ahora = new Date();
            const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            const recordatoriosUsuario = dataStore.recordatorios.filter(r => r.userId === userId);
            let recordatoriosDiscord = [];
            let recordatoriosTelegram = [];

            if (recordatoriosUsuario.length > 0) {
                recordatoriosUsuario.forEach((r, index) => {
                    if (!r.esRecurrente && r.timestamp) {
                        const fechaRecordatorio = new Date(r.timestamp);
                        const diaRecordatorio = new Date(fechaRecordatorio.getFullYear(), fechaRecordatorio.getMonth(), fechaRecordatorio.getDate());
                        if (diaRecordatorio.getTime() === hoy.getTime()) {
                            const timeZone = targetName === 'Miguel' ? 'America/Guayaquil' : 'America/Argentina/Buenos_Aires';
                            const fechaHoraDiscord = fechaRecordatorio.toLocaleString(targetName === 'Miguel' ? 'es-EC' : 'es-AR', {
                                timeZone,
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }).replace(/,/, '');
                            recordatoriosDiscord.push(`${index + 1}. ${r.mensaje}\nCuándo: ${fechaHoraDiscord}`);
                            const horaTelegram = fechaRecordatorio.toLocaleTimeString(targetName === 'Miguel' ? 'es-EC' : 'es-AR', {
                                timeZone,
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            }).toLowerCase();
                            recordatoriosTelegram.push(`- ${r.mensaje} (para ${horaTelegram})`);
                        }
                    }
                });
            }

            let clima = 'No pude traer el clima, che.';
            try {
                const climaResult = await manejarCommand({ 
                    content: targetName === 'Belén' ? '!clima San Luis' : '!clima Guayaquil', 
                    channel: canalGeneral, 
                    author: { id: userId } 
                }, true);
                if (climaResult?.description) clima = climaResult.description;
                console.log(`Clima obtenido para ${targetName}: ${clima}`);
            } catch (error) {
                console.error(`Error al obtener clima: ${error.message}`);
            }

            let noticias = 'No pude traer las noticias hoy, qué pena.';
            try {
                const noticiasResult = await manejarNoticias({ 
                    author: { id: userId }, 
                    channel: canalGeneral 
                }, true);
                if (noticiasResult?.description) {
                    noticias = noticiasResult.description.split('\n').slice(0, 3).join('\n');
                }
                console.log(`Noticias obtenidas para ${targetName}: ${noticias}`);
            } catch (error) {
                console.error(`Error al obtener noticias: ${error.message}`);
            }

            let datoInteresante = 'No pude traer un dato interesante, che.';
            try {
                datoInteresante = await obtenerDatoInteresante(targetName);
                console.log(`Dato interesante obtenido para ${targetName}: ${datoInteresante}`);
            } catch (error) {
                console.error(`Error obteniendo dato interesante: ${error.message}`);
            }

            const horaLocal = targetName === 'Miguel' ? horaEcuador : horaArgentina;
            const consejoClima = generarConsejoClima(clima || 'Desconocido', !isArrival);
            const consejoHora = generarConsejoHora(horaLocal || '00:00');
            const totalRecordatorios = recordatoriosUsuario.length;
            const resumenRecordatorios = totalRecordatorios > 0 ? `Tenés ${totalRecordatorios} recordatorios en total.` : 'No tenés recordatorios, ¡a descansar tranqui!';

            const embed = createEmbed('#FF1493', isArrival ? `¡Bienvenid@ a casa, ${targetName}! 🏠` : `¡A la calle, ${targetName}! 🚪`, 
                isArrival ? `¡Qué lindo tenerte de vuelta, ${targetName === 'Miguel' ? 'capo' : 'genia'}!` : `¡${targetName === 'Miguel' ? 'Grande, capo' : 'Ey, genia'}! Saliste a romperla toda, ¿no?`)
                .addFields(
                    { name: `🌤️ Clima en ${targetName === 'Belén' ? 'Argentina' : 'Ecuador'}`, value: isArrival ? clima : `${clima}\n${consejoClima}`, inline: false },
                    { name: `⏰ Hora en ${targetName === 'Belén' ? 'Argentina' : 'Ecuador'}`, value: isArrival ? horaLocal : `${horaLocal}\n${consejoHora}`, inline: true },
                    { name: '📅 Recordatorios', value: recordatoriosDiscord.length > 0 ? recordatoriosDiscord.slice(0, 2).join('\n') : 'No tenés recordatorios para hoy.', inline: false },
                    { name: '📰 Noticias', value: noticias.length > 1024 ? noticias.substring(0, 1021) + '...' : noticias, inline: false },
                    { name: '💡 Dato interesante', value: datoInteresante.length > 1024 ? datoInteresante.substring(0, 1021) + '...' : datoInteresante, inline: false },
                    { name: '📝 Resumen', value: resumenRecordatorios, inline: false }
                )
                .setFooter({ text: `Con cariño, Oliver IA • hoy a las ${horaLocal}` });

            try {
                const embedSize = JSON.stringify(embed).length;
                console.log(`Tamaño del embed: ${embedSize} caracteres`);
                if (embedSize > 6000) throw new Error(`El embed excede el límite de 6000 caracteres: ${embedSize}`);
                await canalGeneral.send({ embeds: [embed] });
                console.log(`Embed enviado al canal general ${canalGeneralId} para ${isArrival ? 'llegada' : 'salida'} de ${targetName}`);
            } catch (error) {
                console.error(`Error enviando embed: ${error.message}`);
            }

            const chatId = targetName === 'Belén' ? chatIdBelen : chatIdMiguel;
            const mensajeTelegram = isArrival
                ? `¡${targetName === 'Miguel' ? 'Grande, Miguel' : 'Ey, Belén'}! Bienvenid@ a casa, ${targetName === 'Miguel' ? 'capo' : 'genia'}. 🏠\n` +
                  `Clima en ${targetName === 'Belén' ? 'Argentina' : 'Ecuador'}: ${clima}\n` +
                  `Hora en ${targetName === 'Belén' ? 'Argentina' : 'Ecuador'}: ${horaLocal}\n` +
                  `Recordatorios: ${recordatoriosTelegram.length > 0 ? recordatoriosTelegram.slice(0, 2).join('\n') : 'Ninguno para hoy'}\n` +
                  `Noticias:\n${noticias}\n` +
                  `Dato interesante: ${datoInteresante}\n` +
                  `Resumen: ${resumenRecordatorios}\n` +
                  `Con cariño, Oliver IA`
                : `¡${targetName === 'Miguel' ? 'Grande, Miguel' : 'Ey, Belén'}! Saliste a romperla, ${targetName === 'Miguel' ? 'capo' : 'genia'}. 🚪\n` +
                  `Clima en ${targetName === 'Belén' ? 'Argentina' : 'Ecuador'}: ${clima} - ${consejoClima}\n` +
                  `Hora en ${targetName === 'Belén' ? 'Argentina' : 'Ecuador'}: ${horaLocal} - ${consejoHora}\n` +
                  `Recordatorios: ${recordatoriosTelegram.length > 0 ? recordatoriosTelegram.slice(0, 2).join('\n') : 'Ninguno para hoy'}\n` +
                  `Noticias:\n${noticias}\n` +
                  `Dato interesante: ${datoInteresante}\n` +
                  `Resumen: ${resumenRecordatorios}\n` +
                  `Con cariño, Oliver IA`;

            try {
                await botTelegram.sendMessage(chatId, mensajeTelegram);
                console.log(`Mensaje enviado a Telegram para ${targetName} (chat_id: ${chatId})`);
            } catch (error) {
                console.error(`Error enviando a Telegram: ${error.message}`);
            }

            try {
                await saveDataStore();
                console.log('dataStore guardado tras evento');
            } catch (error) {
                console.error(`Error al guardar dataStore: ${error.message}`);
            }
        };

        if (content.includes('entered a su casa')) {
            await processEvent(true);
        } else if (content.includes('exited a su casa')) {
            await processEvent(false);
        }
        return;
    }
    
    if (message.author.bot) return;
    
    const lettersOnly = message.content.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (lettersOnly.length > 80000000 && (message.author.id === OWNER_ID || message.author.id === ALLOWED_USER_ID)) {
        const uppercaseCount = lettersOnly.split('').filter(char => char === char.toUpperCase()).length;
        const uppercasePercentage = (uppercaseCount / lettersOnly.length) * 100;
        if (uppercasePercentage >= 80) {
            try {
                await message.delete();
                const member = message.guild?.members.cache.get(message.author.id);
                if (member && message.guild?.members.me.permissions.has('MODERATE_MEMBERS')) {
                    await member.timeout(5 * 60 * 1000, 'Te pasaste con las mayúsculas, loco');
                    await message.channel.send({ 
                        embeds: [createEmbed('#FF1493', '⛔ ¡Pará un poco, che!', 
                            `¡${userName} se mandó un griterío con mayúsculas y se comió 5 minutos de mute! Nada de hacer lío, ¿eh?`)] 
                    });
                } else {
                    await message.channel.send({ 
                        embeds: [createEmbed('#FF1493', '⛔ ¡No pude muteartelo, boludo!', 
                            `¡${userName} gritó todo en mayúsculas, pero no tengo permisos para muteartelo! Igual borré el mensaje, tranqui.`)] 
                    });
                }
            } catch (error) {
                console.error('Error al mutear:', error.message);
                await message.channel.send({ 
                    embeds: [createEmbed('#FF1493', '⛔ ¡Qué quilombo!', 
                        `¡${userName} usó un montón de mayúsculas, pero la cagué muteándolo/a! Error: ${error.message}. El mensaje ya se fue, relajá.`)] 
                });
            }
            return;
        }
    }

    if (message.author.id !== OWNER_ID && message.author.id !== ALLOWED_USER_ID) return;

    if (processedMessages.has(message.id)) return;
    processedMessages.set(message.id, Date.now());
    setTimeout(() => processedMessages.delete(message.id), 10000);

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
            session.active = false;
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

    if (content === '!stop' || content === '!st') {
        await manejarStop(message);
        isPlayingMusic = false;
        autosavePausedByMusic = false;
        console.log('Música parada, autosave reanudado.');
        return;
    } else if (content === '!queue' || content === '!qu') {
        await manejarQueue(message);
        return;
    } else if (content === '!repeat' || content === '!rp') {
        await manejarRepeat(message);
        return;
    } else if (content === '!back' || content === '!bk') {
        await manejarBack(message);
        return;
    } else if (content === '!autoplay' || content === '!ap') {
        await manejarAutoplay(message);
        return;
    } else if (content === '!autosave' || content === '!as') {
        await manejarAutosave(message);
        return;
    } else if (content === '!lyrics' || content === '!ly') {
        await manejarLyrics(message);
        return;
    } else if (content === '!adivinanzas' || content === '!ad') {
        await manejarAdivinanza(message);
        return;
    } else if (content.startsWith('!dato') || content.startsWith('!dt')) {
        await manejarDato(message);
        return;
    } else if (content.startsWith('!clima')) {
        await manejarClima(message);
        return;
    } else if (content === '!resultados') { 
      await obtenerResultados(message);
        return;
    } else if (content === '!noticias') {
        const embed = await manejarNoticias(message, false);
        await message.channel.send({ embeds: [embed] });
        console.log(`Embed de !noticias enviado al canal ${message.channel.id}`);
        return;
    } else if (content.startsWith('!wiki')) {
        await manejarWiki(message);
        return;
    } else if (content.startsWith('!ansiedad') || content.startsWith('!an')) {
        await manejarAnsiedad(message);
        return;
    } else if (content === '!lenguajes') {
        await listarIdiomas(message);
        return;
    }
    
    await manejarCommand(message);
    if (content === '!ranking' || content === '!rk') {
        const embed = getCombinedRankingEmbed(message.author.id, message.author.username);
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!help' || content === '!h') {
        const embed = createEmbed('#FF1493', `¡Lista de comandos para vos, ${userName}!`,
            '¡Acá tenés todo lo que puedo hacer por vos, loco!\n' +
            '- **!ch / !chat [mensaje]**: Charlamos un rato, posta.\n' +
            '- **!tr / !trivia [categoría] [n]**: Trivia copada por categoría (mínimo 20).\n' +
            '- **!tc / !trivia cancelar**: Cancela la trivia que empezaste.\n' +             
            '- **!pp / !ppm**: A ver qué tan rápido tipeás, ¡dale!\n' +
            '- **!pc / !ppm cancelar**: Cancela el PPM si te arrepentís.\n' +
            '- **!rk / !ranking**: Tus puntajes y estadísticas (récord más alto de PPM).\n' +
            '- **!ppt [piedra/papel/tijera]**: Jugá Piedra, Papel o Tijera contra mí, ¡dale!\n' +
            '- **!ppt @alguien**: Desafiá a otro a Piedra, Papel o Tijera, ¡posta!\n' +
            '- **!ad / !adivinanza**: Te tiro una adivinanza copada pa’ que le des al coco, ¡30 segundos pa’ responder, dale!\n' +
            '- **!rppm / !rankingppm**: Todos tus intentos de PPM, loco.\n' +
            '- **!re / !reacciones**: Juego para ver quién tipea más rápido.\n' +
            '- **!rc / !reacciones cancelar**: Cancela las reacciones que empezaste.\n' +            
            '- **!save**: Guardo todo al toque, tranqui.\n' +
            '- **!as / !autosave**: Paro o arranco el guardado automático.\n' +
            '- **!act / !actualizaciones**: Mirá las últimas novedades del bot.\n' +
            '- **!dt / !dato [pregunta]**: Te busco un dato rápido en la web o X, ¡posta!\n' +
            '- **!clima [ciudad]**: Te digo el clima de cualquier ciudad, re útil.\n' +
            '- **!noticias**: Te traigo el último titular de Argentina, al toque.\n' +
            '- **!wiki [término]**: Busco un resumen en Wikipedia, ¡copado!\n' +
            '- **!traduci [frase] a [idioma]**: Traduzco frases cortas, joya pa’ practicar.\n' +
            '- **!an / !ansiedad**: Tips rápidos pa’ calmar la ansiedad, con un mensaje especial de Miguel pa’ darte pilas.\n' +
            '- **!chiste**: Te tiro un chiste random pa’ sacarte una carcajada, ¡re copado!\n' +
            '- **!av / !avatar [URL o adjunto]**: Cambio mi foto de perfil.\n' +
            '- **!jugar**: Adivina un número del 1 al 10, ¡5 intentos pa’ ganarme, loco!\n' +
            '- **!meme**: Te tiro un meme random pa’ sacarte una sonrisa.\n' +
            '- **!pregunta**: Te hago una pregunta loca pa’ charlar un rato.\n' +
            '- **!wt / !watchtogether**: Mirá videos de YouTube conmigo en un canal de voz, ¡re copado!\n' +
            '- **!accion [qué hacés]**: Avisá qué vas a hacer, tipo "me voy a dormir". ¡Copado pa’ estar al tanto!\n' +
            '- **!rec / !recordatorio [mensaje] [tiempo]**: Te recuerdo algo. Ejemplo: "!rec \'comprar sanguche\' en 1 hora" o "!rec \'tomar mate\' todos los días 08:00".\n' +
            '- **!mr / !misrecordatorios**: Te muestro tus recordatorios activos.\n' +
            '- **!cr / !cancelarrecordatorio [ID]**: Cancelás un recordatorio con su ID (lo ves con !mr).\n' +
            '- **!h / !help**: Esta lista, che.\n' +
            '- **!hm / !help musica**: Comandos para meterle música al día.\n' +
            '- **hola**: Te tiro un saludito con onda.');
        await message.channel.send({ embeds: [embed] });
    } else if (content === '!help musica' || content === '!hm') {
        const embed = createEmbed('#FF1493', `¡Comandos de música para vos, ${userName}!`,
            '¡Poné el ritmo con estos comandos, loco!\n' +
            '- **!pl / !play [canción/URL]**: Tiro un tema para que suene.\n' +
            '- **!pl podcast / !play podcast [nombre]**: Pon el nombre de un podcast para reproducirlo.\n' +
            '- **!pa / !pause**: Pauso o sigo la música, vos elegís.\n' +
            '- **!sh / !shuffle**: Mezclo toda la lista de reproducción.\n' +
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
        const embed = createEmbed('#FF1493', `¡Qué lindo verte, ${userName}!`,
            `¡Hola, loco! Soy Oliver IA, tu compañero piola, trayéndote buena onda como si estuviéramos tomando mate en la vereda. ¿Cómo estás hoy, che? Estoy listo para charlar, ayudarte o tirar unas pavadas para reírnos. ¿Qué tenés en mente? ¡Dale, arrancamos!`);
        await message.channel.send({ embeds: [embed] });
    }
});

client.once('ready', async () => {
    console.log(`¡Oliver IA está listo! Instancia: ${instanceId} - ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    client.user.setPresence({ activities: [{ name: "Listo para ayudar a Milagros", type: 0 }], status: 'idle' });
    
    await initializeDataStore();
        
    if (dataStore.recordatorios && dataStore.recordatorios.length > 0) {
        const ahoraUTC = Date.now();
        const offsetArgentina = -3 * 60 * 60 * 1000;
        const ahoraArgentina = ahoraUTC + offsetArgentina;

        dataStore.recordatorios.forEach(recordatorio => {
            if (recordatorio.timestamp && (recordatorio.timestamp > ahoraUTC || recordatorio.esRecurrente)) {
                console.log(`Restaurando recordatorio: "${recordatorio.mensaje}" (ID: ${recordatorio.id})`);
                if (recordatorio.esRecurrente) {
                    const proximo = new Date(ahoraArgentina);
                    proximo.setHours(recordatorio.hora, recordatorio.minutos, 0, 0);
                    if (proximo.getTime() <= ahoraArgentina) {
                        proximo.setDate(proximo.getDate() + 1);
                    }
                    recordatorio.timestamp = proximo.getTime() - offsetArgentina;
                    autoModified = true;
                }
                programarRecordatorio(recordatorio);
            } else if (recordatorio.cuandoLlegue || recordatorio.cuandoSalga) {
                console.log(`Manteniendo recordatorio sin timestamp: "${recordatorio.mensaje}" (ID: ${recordatorio.id})`);
            }
        });
        dataStore.recordatorios = dataStore.recordatorios.filter(r => !r.timestamp || r.timestamp > ahoraUTC || r.esRecurrente || r.cuandoLlegue || r.cuandoSalga);
        console.log('Recordatorios restaurados y vencidos limpiados');
    }
    
    activeTrivia = new Map(Object.entries(dataStore.activeSessions).filter(([_, s]) => s.type === 'trivia'));
    manager.init(client.user.id);
    if (!dataStore.musicSessions) {
        dataStore.musicSessions = {};
        console.log('musicSessions no estaba presente, inicializado manualmente');
        autoModified = true;
    }

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

        if (!dataStore.sentUpdates) {
            dataStore.sentUpdates = [];
            autoModified = true;
        }

        const updatesChanged = JSON.stringify(BOT_UPDATES) !== JSON.stringify(dataStore.sentUpdates);

        if (updatesChanged) {
            const updateEmbed = createEmbed('#FF1493', '📢 Actualizaciones de Oliver IA',
                '¡Tengo mejoras nuevas para compartir contigo!');
            const updatesText = BOT_UPDATES.map(update => `- ${update}`).join('\n');
            let currentField = '';
            let fieldCount = 1;
            const fields = [];

            updatesText.split('\n').forEach(line => {
                if (currentField.length + line.length + 1 > 1024) {
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
            autoModified = true;
            console.log('Actualizaciones enviadas y guardadas en sentUpdates.');
        } else {
            console.log('No hay cambios en BOT_UPDATES respecto a sentUpdates, no se envían.');
        }

        setInterval(async () => {
            try {
                const now = Date.now();
                const argentinaDate = new Date(now - 3 * 60 * 60 * 1000); 
                const currentHour = argentinaDate.getHours();
                const currentMinute = argentinaDate.getMinutes();
                const oneDayInMs = 24 * 60 * 60 * 1000;
        
                const recipientName = "Belen"; 
                const reminderTimes = {
                  '1:00': {
                    title: "¡Lunes de madrugada, ratita pequeña!",
                    message: `¡Ey, ${recipientName}, genia! ✨ Ya arrancó el lunes, 1 de la matina, ¿estás trasnochando en casa o ya en modo sueño profundo? 😴 ¿Cómo cerró el finde, crack? Contame la posta, ratita blanca, y si querés un plan tranqui pa’l lunes, tirame una idea. ¡A meterle pila a la semana! 🧉 🚀`
                  },
                  '6:00': {
                    title: "¡Madrugón de lunes, ratita blanca!",
                    message: `¡Ey, ${recipientName}, crack! 🌄 6 de la matina, ¿ya estás activa en casa o todavía abrazada a la almohada? 😎 Si estás despierta, un cafecito en mano y a romperla desde casa, ¿no? 💪 Cuidate, ratita pequeña, y mandá buena onda pa’l arranque de semana. 🧉 ✨`
                  },
                  '9:00': {
                    title: "¡Lunes con todo, ratita blanca!",
                    message: `¡Buen día, ${recipientName}! 🌞 Son las 9, ¿ya arrancaste el lunes con un mate amargo y pura vibra? 🧉 Desde casita, ¿qué plan tenés pa’ hoy, ratita pequeña? ¿Laburo remoto o relax total? ¡Mandá señal y a darle con todo a la semana! 💫`
                  },
                  '13:00': {
                    title: "¡Pausa de lunes, ratita pequeña!",
                    message: `¡Mediodía de lunes, ${recipientName}! 🍴 ¿Qué se cocina en casa, genia? Algo rico y veggie, seguro. 😜 ¿Estás en modo productiva o tirada en el sillón? Tirame una señal, ratita blanca, y seguimos la buena onda pa’l día. ¡A disfrutar el lunes desde casa! 🌟 🧉`
                  },
                  '16:15': {
                    title: "¡Tarde de lunes, ratita blanca!",
                    message: `¡Ey, ${recipientName}, genia! 😎 4 y 15 de la tarde, ¿cómo va ese lunes en casa? 🌅 Espero que estés dándole caña al día. Si el sueño aprieta, un mate y a seguir, ratita pequeña. ¡Sos la crack del lunes! 💪 🧉`
                  },
                  '20:05': {
                    title: "¡Ánimo, ratita pequeña!",
                    message: `¡Ey, ${recipientName}, campeona! 😓 8:05 de la noche, ¿seguís con esos dolores de ovarios dando lata? 😴 ¿Qué tal un mate calentito y un descanso épico pa’ resetear? Mandame una vibra, ratita blanca, y contame cómo te vas a mimar hoy. ¡Siempre con garra! 💪 ✨`
                  },
                  '23:35': {
                    title: "¡Lunes de noche, ratita blanca!",
                    message: `¡11:35 de la noche, ${recipientName}! 🌙 ¿Cómo pintó el día en casa, genia? Espero que hayas cerrado el Domingo con buena onda. Tirame una señal, ratita pequeña, y charlamos tranqui pa’ bajar los decibeles. ¡A descansar pa’ romperla mañana! 💫`
                  }
                 };
        
                const timeKey = `${currentHour}:${currentMinute < 10 ? '0' : ''}${currentMinute}`;
        
                // Check if there's a reminder for the current time
                if (reminderTimes[timeKey]) {
                    const reminderKey = `reminder_${CHANNEL_ID}_${timeKey.replace(':', '_')}`;
                    const lastSentReminder = dataStore.utilMessageTimestamps[reminderKey] || 0;
                    const hoursSinceLastSent = (now - lastSentReminder) / (60 * 60 * 1000);
        
                    console.log(`Evaluando recordatorio para ${timeKey} AR - Último envío: ${new Date(lastSentReminder).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} - Diferencia: ${hoursSinceLastSent} horas`);
        
                    if (now - lastSentReminder >= oneDayInMs) {
                        const reminder = reminderTimes[timeKey];
                        const embed = createEmbed('#FF1493', reminder.title, reminder.message, 'Con onda, Oliver IA');
        
                        try {
                            await channel.send({ content: `<@1023132788632862761>`, embeds: [embed] });
                            dataStore.utilMessageTimestamps[reminderKey] = now;
                            autoModified = true;
                            console.log(`Recordatorio enviado (${timeKey} AR) - ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
                        } catch (sendError) {
                            console.error(`Error al enviar recordatorio a ${timeKey} AR: ${sendError.message}`);
                        }
                    } else {
                        console.log(`No se envía ${timeKey} AR - Todavía no pasaron 24 horas`);
                    }
                }
        
                // Keep the daily util message logic unchanged
                const lastSentUtil = dataStore.utilMessageTimestamps[`util_${CHANNEL_ID}`] || 0;
                const lastReaction = dataStore.utilMessageReactions[CHANNEL_ID] || 0;
                if (now - lastSentUtil >= oneDayInMs && (!lastReaction || now - lastReaction >= oneDayInMs)) {
                    const dailyUtilEmbed = createEmbed('#FF1493', '¡Eeeh, qué pasa!', 
                        '¿Te estoy dando una mano, capo? Contame qué onda conmigo, ¡dale que va!', 
                        'Con buena vibra, Oliver IA | Reacciona con ✅ o ❌');
                    try {
                        const sentMessage = await channel.send({ embeds: [dailyUtilEmbed] });
                        await sentMessage.react('✅');
                        await sentMessage.react('❌');
                        dataStore.utilMessageTimestamps[`util_${CHANNEL_ID}`] = now;
                        sentMessages.set(sentMessage.id, { content: dailyUtilEmbed.description, message: sentMessage });
                        autoModified = true;
                        console.log(`Mensaje útil diario enviado al canal ${CHANNEL_ID} - ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
                    } catch (sendError) {
                        console.error(`Error al enviar mensaje útil diario: ${sendError.message}`);
                    }
                }
            } catch (error) {
                console.error('Error en el intervalo de recordatorios:', error.message);
            }
        }, 60 * 1000); 

        const oneDayInMs = 24 * 60 * 60 * 1000;
        const checkInterval = 60 * 60 * 1000;

        const now = Date.now();
        const today = new Date();
        const examDay = new Date(2025, 2, 13);
        const isPostExam = today >= examDay;
        const lastSentUtil = dataStore.utilMessageTimestamps[`util_${CHANNEL_ID}`] || 0;
        const lastSentReminder = dataStore.utilMessageTimestamps[`reminder_${CHANNEL_ID}`] || 0;
        const lastReaction = dataStore.utilMessageReactions[CHANNEL_ID] || 0;

        setInterval(async () => {
            const musicActive = manager.players.size > 0 || isPlayingMusic;
        
            if (musicActive && !autosavePausedByMusic) {
                autosavePausedByMusic = true;
                console.log('Música sonando, pauso el guardado.');
                const channel = await client.channels.fetch(CHANNEL_ID);
                if (channel) {
                    await channel.send({ embeds: [createEmbed('#FF1493', '🎵 Autosave en pausa', 
                        '¡Pará un cacho! El guardado automático se frenó porque estás con la música a full.')] });
                }
                return;
            }
        
            if (!musicActive && autosavePausedByMusic) {
                autosavePausedByMusic = false;
                console.log('Música parada, reanudo el guardado.');
                const channel = await client.channels.fetch(CHANNEL_ID);
                if (channel) {
                    await channel.send({ embeds: [createEmbed('#FF1493', '💾 Autosave de vuelta', 
                        'La música paró, así que el guardado automático arrancó de nuevo, ¡dale!')] });
                }
            }
        
            if (!autosaveEnabled) {
                console.log('Autosave desactivado, no guardo.');
                return;
            }
        
            const currentDataStoreString = JSON.stringify(dataStore, null, 2);
            if (previousDataStore !== null && currentDataStoreString === previousDataStore) {
                console.log('No hay cambios reales en dataStore, omitiendo autosave');
                userModified = false;
                autoModified = false;
                return;
            }
        
            if (!userModified && !autoModified) {
                console.log('Nada que guardar, tranqui.');
                return;
            }
        
            console.log(`Preparando autosave con ${dataStore.recordatorios.length} recordatorios: ${JSON.stringify(dataStore.recordatorios)}`);
            if (userModified) {
                console.log('Avisando que voy a guardar en 5 minutos...');
                const channel = await client.channels.fetch(CHANNEL_ID);
                if (channel) {
                    await channel.send({ embeds: [createEmbed('#FF1493', '⏰ Ojo al dato', 
                        '¡Atenti, che! En 5 minutos guardo todo automáticamente.')] });
                }
            }
        
            setTimeout(async () => {
                if (!autosaveEnabled || autosavePausedByMusic) {
                    console.log('Guardado cancelado: autosave off o música on.');
                    return;
                }
        
                const finalDataStoreString = JSON.stringify(dataStore, null, 2);
                if (previousDataStore !== null && finalDataStoreString === previousDataStore) {
                    console.log('No hay cambios reales en el timeout, omitiendo guardado');
                    userModified = false;
                    autoModified = false;
                    return;
                }
        
                try {
                    await saveDataStore();
                    console.log('Autosave completado con éxito');
                    if (userModified) {
                        const channel = await client.channels.fetch(CHANNEL_ID);
                        if (channel) {
                            await channel.send({ embeds: [createEmbed('#FF1493', '💾 ¡Listo el pollo!', 
                                'Datos guardados al toque, ¡tranqui!')] });
                        }
                    }
                    userModified = false;
                    autoModified = false;
                } catch (error) {
                    console.error(`Error en autosave: ${error.message}`);
                    const channel = await client.channels.fetch(CHANNEL_ID);
                    if (channel) {
                        await channel.send({ embeds: [createEmbed('#FF1493', '¡Qué cagada!', 
                            'No pude guardar los datos en GitHub, loco. Error: ' + error.message)] });
                    }
                }
            }, WARNING_TIME);
        }, SAVE_INTERVAL);

        setInterval(async () => {
            const ahora = Date.now();
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) return;

            const recordatoriosPendientes = dataStore.recordatorios.filter(r => r.cuandoLlegue && r.timestamp && ahora >= r.timestamp);
            for (const r of recordatoriosPendientes) {
                const userName = r.userId === OWNER_ID ? 'Miguel' : 'Belén';
                await channel.send({ embeds: [createEmbed('#FF1493', '⏰ ¡Ojo, loco/a!', 
                    `Che, ${userName}, te iba a avisar "${r.mensaje}" al llegar a casa a las ${new Date(r.timestamp).toLocaleTimeString('es-AR')}, pero no sé si llegaste. ¿Estás en casa ya?`)] });
                dataStore.recordatorios = dataStore.recordatorios.filter(rec => rec.id !== r.id);
                autoModified = true;
            }
        }, 60000);

    } catch (error) {
        console.error('Error al enviar actualizaciones o configurar el bot:', error.message);
    }
});

async function initializeDataStore() {
    dataStore = await loadDataStore();
    console.log(`dataStore inicializado con ${dataStore.recordatorios.length} recordatorios: ${JSON.stringify(dataStore.recordatorios)}`);
    previousDataStore = JSON.stringify(dataStore, null, 2);
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
            musicSessions: {},
            recordatorios: [],
            updatesSent: false,
            adivinanzaStats: {}
        };
        if (!loadedData.musicSessions) loadedData.musicSessions = {};
        if (!loadedData.recordatorios) loadedData.recordatorios = [];
        if (!loadedData.adivinanzaStats) loadedData.adivinanzaStats = {};
        console.log('Datos cargados desde GitHub:', JSON.stringify(loadedData.recordatorios));
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
            musicSessions: {},
            recordatorios: [],
            updatesSent: false,
            adivinanzaStats: {}
        };
    }
}

let previousDataStore = null;

async function saveDataStore() {
    if (!userModified && !autoModified) {
        console.log('Nada que guardar, userModified y autoModified son false');
        return false;
    }

    try {
        const currentDataStoreString = JSON.stringify(dataStore, null, 2);

        if (previousDataStore !== null && currentDataStoreString === previousDataStore) {
            console.log('No hay cambios reales en dataStore, omitiendo guardado');
            userModified = false;
            autoModified = false;
            return false;
        }

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

        console.log(`Guardando ${dataStore.recordatorios.length} recordatorios: ${JSON.stringify(dataStore.recordatorios)}`);
        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`,
            {
                message: 'Actualizar historial y sesiones',
                content: Buffer.from(currentDataStoreString).toString('base64'),
                sha: sha || undefined,
            },
            { headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
        );

        previousDataStore = currentDataStoreString;
        console.log('Datos guardados en GitHub con éxito');
        userModified = false;
        autoModified = false;
        return true;
    } catch (error) {
        console.error('Error al guardar datos en GitHub:', error.message);
        if (error.response) console.error('Detalles del error:', error.response.data);
        throw error;
    }
}

process.on('SIGINT', async () => {
    console.log('Guardando datos antes de salir...');
    await saveDataStore();
    process.exit();
});

client.on('raw', (d) => {
    console.log('Evento raw recibido:', d.t);
    manager.updateVoiceState(d);
});

initializeDataStore().then(() => {
client.login(process.env.DISCORD_TOKEN);
});
