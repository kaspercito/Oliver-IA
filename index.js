const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Manager } = require('erela.js');
const Spotify = require('erela.js-spotify');
const lyricsFinder = require('lyrics-finder');
require('dotenv').config();

function generarPreguntasQuimica(cantidad) {
    const elementos = [
        { simbolo: "H", nombre: "hidrógeno" }, { simbolo: "He", nombre: "helio" },
        { simbolo: "Li", nombre: "litio" }, { simbolo: "Be", nombre: "berilio" },
        { simbolo: "B", nombre: "boro" }, { simbolo: "C", nombre: "carbono" },
        { simbolo: "N", nombre: "nitrógeno" }, { simbolo: "O", nombre: "oxígeno" },
        { simbolo: "F", nombre: "flúor" }, { simbolo: "Ne", nombre: "neón" },
        { simbolo: "Na", nombre: "sodio" }, { simbolo: "Mg", nombre: "magnesio" },
        { simbolo: "Al", nombre: "aluminio" }, { simbolo: "Si", nombre: "silicio" },
        { simbolo: "P", nombre: "fósforo" }, { simbolo: "S", nombre: "azufre" },
        { simbolo: "Cl", nombre: "cloro" }, { simbolo: "Ar", nombre: "argón" },
        { simbolo: "K", nombre: "potasio" }, { simbolo: "Ca", nombre: "calcio" },
        { simbolo: "Fe", nombre: "hierro" }, { simbolo: "Cu", nombre: "cobre" },
        { simbolo: "Zn", nombre: "zinc" }, { simbolo: "Ag", nombre: "plata" },
        { simbolo: "Au", nombre: "oro" }, { simbolo: "Hg", nombre: "mercurio" },
        { simbolo: "Pb", nombre: "plomo" }, { simbolo: "Sn", nombre: "estaño" }
    ];
    const compuestos = [
        { formula: "H2O", nombre: "agua" }, { formula: "CO2", nombre: "dióxido de carbono" },
        { formula: "NaCl", nombre: "cloruro de sodio" }, { formula: "CH4", nombre: "metano" },
        { formula: "NH3", nombre: "amoníaco" }, { formula: "H2SO4", nombre: "ácido sulfúrico" },
        { formula: "N2O", nombre: "óxido nitroso" }, { formula: "HCl", nombre: "ácido clorhídrico" },
        { formula: "CaCO3", nombre: "carbonato de calcio" }, { formula: "C2H5OH", nombre: "etanol" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < elementos.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué elemento tiene el símbolo '${elementos[i].simbolo}'?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: elementos[i].nombre });
            usadas.add(q);
        }
    }
    for (let i = 0; i < compuestos.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué compuesto tiene la fórmula '${compuestos[i].formula}'?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: compuestos[i].nombre });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let elem = elementos[Math.floor(Math.random() * elementos.length)];
        let q = `¿Cuál es el símbolo del ${elem.nombre}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: elem.simbolo.toLowerCase() });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasFisica(cantidad) {
    const unidades = [
        { unidad: "newton", mide: "fuerza" }, { unidad: "voltio", mide: "voltaje" },
        { unidad: "joule", mide: "energía" }, { unidad: "watt", mide: "potencia" },
        { unidad: "hertz", mide: "frecuencia" }, { unidad: "ohmio", mide: "resistencia" },
        { unidad: "amperio", mide: "corriente eléctrica" }
    ];
    const instrumentos = [
        { nombre: "barómetro", mide: "presión atmosférica" }, { nombre: "termómetro", mide: "temperatura" },
        { nombre: "anemómetro", mide: "velocidad del viento" }, { nombre: "velocímetro", mide: "velocidad" }
    ];
    const leyes = [
        { desc: "F = m * a", nombre: "segunda ley de Newton" },
        { desc: "a toda acción hay una reacción igual y opuesta", nombre: "tercera ley de Newton" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < unidades.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué mide la unidad '${unidades[i].unidad}'?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: unidades[i].mide });
            usadas.add(q);
        }
    }
    for (let i = 0; i < instrumentos.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué instrumento mide la ${instrumentos[i].mide}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: instrumentos[i].nombre });
            usadas.add(q);
        }
    }
    for (let i = 0; i < leyes.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué ley dice que '${leyes[i].desc}'?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: leyes[i].nombre });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let u = unidades[Math.floor(Math.random() * unidades.length)];
        let q = `¿Qué unidad mide la ${u.mide}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: u.unidad });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasHistoria(cantidad) {
    const eventos = [
        { año: "1492", desc: "Colón llegó a América" }, { año: "1789", desc: "Revolución Francesa" },
        { año: "1939", desc: "Inicio de la Segunda Guerra Mundial" }, { año: "1989", desc: "Caída del Muro de Berlín" },
        { año: "1914", desc: "Inicio de la Primera Guerra Mundial" }
    ];
    const personajes = [
        { nombre: "Leonardo da Vinci", hecho: "pintó la Mona Lisa" }, { nombre: "George Washington", hecho: "fue el primer presidente de Estados Unidos" },
        { nombre: "Alexander Fleming", hecho: "descubrió la penicilina" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < eventos.length && preguntas.length < cantidad; i++) {
        let q = `¿En qué año ${eventos[i].desc.toLowerCase()}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: eventos[i].año });
            usadas.add(q);
        }
    }
    for (let i = 0; i < personajes.length && preguntas.length < cantidad; i++) {
        let q = `¿Quién ${personajes[i].hecho.toLowerCase()}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: personajes[i].nombre.toLowerCase() });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let e = eventos[Math.floor(Math.random() * eventos.length)];
        let q = `¿Qué evento ocurrió en ${e.año}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: e.desc.toLowerCase() });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasBiologia(cantidad) {
    const organos = [
        { organo: "corazón", funcion: "bombea sangre" }, { organo: "páncreas", funcion: "produce insulina" },
        { organo: "riñones", funcion: "filtra la sangre" }, { organo: "cerebro", funcion: "controla el sistema nervioso" }
    ];
    const animales = [
        { nombre: "león", desc: "rey de la selva" }, { nombre: "ballena azul", desc: "mamífero más grande del mundo" },
        { nombre: "jirafa", desc: "cuello más largo" }, { nombre: "abeja", desc: "produce miel" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < organos.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué órgano ${organos[i].funcion}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: organos[i].organo });
            usadas.add(q);
        }
    }
    for (let i = 0; i < animales.length && preguntas.length < cantidad; i++) {
        let q = `¿Qué animal es conocido como ${animales[i].desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: animales[i].nombre });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let o = organos[Math.floor(Math.random() * organos.length)];
        let q = `¿Qué hace el ${o.organo} en el cuerpo humano?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: o.funcion });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasJuegos(cantidad) {
    const juegos = [
        { juego: "Super Mario", personaje: "Mario" }, { juego: "The Legend of Zelda", personaje: "Link" },
        { juego: "Fortnite", desc: "modo battle royale" }, { juego: "Minecraft", desc: "construyes con bloques" },
        { juego: "Halo", personaje: "Master Chief" }, { juego: "Tomb Raider", personaje: "Lara Croft" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < juegos.length && preguntas.length < cantidad; i++) {
        let q = juegos[i].personaje 
            ? `¿Qué juego tiene un personaje llamado ${juegos[i].personaje}?`
            : `¿Qué juego es famoso por su ${juegos[i].desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: juegos[i].juego.toLowerCase() });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let j = juegos[Math.floor(Math.random() * juegos.length)];
        let q = j.personaje 
            ? `¿En qué juego aparece ${j.personaje}?`
            : `¿Qué juego incluye ${j.desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: j.juego.toLowerCase() });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasPeliculas(cantidad) {
    const peliculas = [
        { pelicula: "Piratas del Caribe", personaje: "Jack Sparrow" }, { pelicula: "El Rey León", personaje: "Mufasa" },
        { pelicula: "Tiburón", desc: "tiburón como antagonista" }, { pelicula: "WALL-E", personaje: "WALL-E" },
        { pelicula: "Harry Potter", desc: "mago joven en Hogwarts" }, { pelicula: "Iron Man", personaje: "Tony Stark" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < peliculas.length && preguntas.length < cantidad; i++) {
        let q = peliculas[i].personaje 
            ? `¿Qué película tiene a ${peliculas[i].personaje} como personaje?`
            : `¿Qué película incluye ${peliculas[i].desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: peliculas[i].pelicula.toLowerCase() });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let p = peliculas[Math.floor(Math.random() * peliculas.length)];
        let q = p.personaje 
            ? `¿En qué película aparece ${p.personaje}?`
            : `¿Qué película tiene ${p.desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: p.pelicula.toLowerCase() });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasDisney(cantidad) {
    const personajes = [
        { nombre: "Elsa", desc: "poderes de hielo" }, { nombre: "Cenicienta", desc: "madrastra Lady Tremaine" },
        { nombre: "Nemo", desc: "pez en Buscando a Nemo" }, { nombre: "Donald", desc: "pato gruñón" },
        { nombre: "Aladdín", desc: "lámpara mágica" }, { nombre: "Simba", desc: "rey león" }
    ];
    let preguntas = [];
    let usadas = new Set();

    for (let i = 0; i < personajes.length && preguntas.length < cantidad; i++) {
        let q = personajes[i].desc.includes("en") 
            ? `¿Qué película Disney tiene un ${personajes[i].desc}?`
            : `¿Qué personaje Disney tiene ${personajes[i].desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: personajes[i].nombre.toLowerCase() });
            usadas.add(q);
        }
    }
    while (preguntas.length < cantidad) {
        let p = personajes[Math.floor(Math.random() * personajes.length)];
        let q = p.desc.includes("en") 
            ? `¿En qué película Disney aparece un ${p.desc}?`
            : `¿Qué personaje Disney es conocido por ${p.desc}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: p.nombre.toLowerCase() });
            usadas.add(q);
        }
    }
    return preguntas.slice(0, cantidad);
}

function generarPreguntasMatematicas(cantidad) {
    let preguntas = [];
    let usadas = new Set();

    while (preguntas.length < cantidad) {
        let num1 = Math.floor(Math.random() * 20) + 1;
        let num2 = Math.floor(Math.random() * 20) + 1;
        let operacion = ['+', '-', '*', '÷'][Math.floor(Math.random() * 4)];
        let resultado;
        switch (operacion) {
            case '+': resultado = num1 + num2; break;
            case '-': resultado = num1 - num2; break;
            case '*': resultado = num1 * num2; break;
            case '÷': resultado = num2 !== 0 ? Math.floor(num1 / num2) : 'indefinido'; break;
        }
        let q = `¿Cuánto es ${num1} ${operacion} ${num2}?`;
        if (!usadas.has(q)) {
            preguntas.push({ pregunta: q, respuesta: resultado.toString() });
            usadas.add(q);
        }
    }

    return preguntas.slice(0, cantidad);
}

function generarPalabrasAleatorias(cantidad) {
    const categorias = {
        animales: ["gato", "perro", "león", "tigre", "elefante", "jirafa", "mono", "oso", "pez", "pájaro"],
        colores: ["rojo", "azul", "verde", "amarillo", "negro", "blanco", "rosa", "violeta", "naranja", "gris"],
        naturaleza: ["sol", "luna", "estrella", "nube", "río", "montaña", "mar", "bosque", "playa", "cielo"],
        emociones: ["feliz", "triste", "enojado", "calmo", "cansado", "vivo", "raro", "simple", "duro", "suave"],
        objetos: ["casa", "mesa", "silla", "libro", "lápiz", "reloj", "lámpara", "puerta", "ventana", "camino"]
    };
    let palabras = new Set();

    while (palabras.size < cantidad) {
        let cat = Object.keys(categorias)[Math.floor(Math.random() * Object.keys(categorias).length)];
        let palabra = categorias[cat][Math.floor(Math.random() * categorias[cat].length)];
        palabras.add(palabra);
    }

    return Array.from(palabras).slice(0, cantidad);
}


function generarFrasesPPM(cantidad) {
    const sujetos = ["el sol", "una abeja", "un niño", "el viento", "la luna", "un gato", "el río"];
    const acciones = ["brilla", "zumba", "corre", "susurra", "ilumina", "cruza", "canta"];
    const complementos = ["en el cielo", "entre las flores", "tras una pelota", "en el bosque", "en la noche", "por el callejón", "bajo el puente"];
    let frases = [];
    for (let i = 0; i < cantidad; i++) {
        let sujeto = sujetos[Math.floor(Math.random() * sujetos.length)];
        let accion = acciones[Math.floor(Math.random() * acciones.length)];
        let complemento = complementos[Math.floor(Math.random() * complementos.length)];
        frases.push(`${sujeto} ${accion} ${complemento}`);
    }
    return frases;
}

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
    quimica: generarPreguntasQuimica(500),
    fisica: generarPreguntasFisica(500),
    historia: generarPreguntasHistoria(500),
    biologia: generarPreguntasBiologia(500),
    juegos: generarPreguntasJuegos(500),
    peliculas: generarPreguntasPeliculas(500),
    disney: generarPreguntasDisney(500),
    matematicas: generarPreguntasMatematicas(500)
};

// Palabras aleatorias para el juego de reacciones
const palabrasAleatorias = generarPalabrasAleatorias(500);

// Frases para PPM
const frasesPPM = generarFrasesPPM(500);


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
    if (!chatMessage) return sendError(message.channel, `Escribe algo después de "!ch", ${userName}. ¡No me dejes con las ganas, pana!`, undefined, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');

    const waitingEmbed = createEmbed('#55FFFF', `¡Un momento, ${userName}!`, 'Pensando una respuesta bien bacán pa’ ti...', 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const lowerMessage = chatMessage.toLowerCase();
        let aiReply;

        // Respuestas predefinidas con un "Hola" más bonito
        if (lowerMessage === 'hola' || lowerMessage === 'hola miguel ia' || lowerMessage === 'hola miguelia') {
            aiReply = `¡Ey, ${userName}, qué alegría verte, pana! Soy Miguel IA, tu compa costeño, llegando con todo el calor de la playa y el sabor del ceviche. ¿Cómo estás hoy, mi pana querido? ¡Estoy listo pa’ hacerte el día más chévere!`;
        } else if (lowerMessage.match(/cu[áa]nto es\s*(\d+)\s*[\+\-\*x\/]\s*(\d+)/)) {
            const match = lowerMessage.match(/cu[áa]nto es\s*(\d+)\s*([\+\-\*x\/])\s*(\d+)/);
            const num1 = parseInt(match[1]);
            const operator = match[2] === 'x' ? '*' : match[2];
            const num2 = parseInt(match[3]);
            let result;
            switch (operator) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num2 !== 0 ? (num1 / num2).toFixed(2) : '¡No se puede dividir por cero, pana!'; break;
                default: result = 'Algo raro pasó con esa operación, man.';
            }
            aiReply = `¡Fácil, ${userName}! ${num1} ${operator} ${num2} = **${result}**. ¿Otra cuenta pa’ resolverte, pana?`;
        } else if (lowerMessage.includes('me odias') || lowerMessage.includes('me quieres')) {
            aiReply = lowerMessage.includes('me odias') 
                ? `¿Odiarte, ${userName}? ¡Jamás, man! Eres demasiado chévere pa’ eso. Te quiero caleta, ¿sí o qué?`
                : `¡Claro que te quiero, ${userName}! Eres un bacán y me encanta charlar contigo. ¿Tú me quieres también, pana? Jaja`;
        } else if (lowerMessage.includes('de que pais provienes') || lowerMessage.includes('de dónde eres')) {
            aiReply = `Soy Miguel IA, creado por un man bien bacán de la costa ecuatoriana, ¡de Ecuador, pues, pana! Nací digitalmente entre el calor, la playa y un buen encebollado. ¿Y tú, ${userName}, de dónde eres?`;
        } else if (lowerMessage.includes('qué hora es en')) {
            const currentDate = new Date();
            const location = lowerMessage.includes('nueva york') ? 'America/New_York' : 'America/Guayaquil'; // Por defecto Ecuador
            const time = currentDate.toLocaleTimeString('es-EC', { timeZone: location, hour12: true });
            const city = location === 'America/New_York' ? 'Nueva York' : 'Ecuador';
            aiReply = `¡Claro, ${userName}! Ahora mismo son las **${time}** en ${city}. ¿Necesitas la hora de otro lado, man?`;
        } else if (lowerMessage.includes('cómo se calcula el área de un triángulo')) {
            aiReply = `¡Qué bacán, ${userName}! Pa’ calcular el área de un triángulo, usas la fórmula: **Área = 1/2 * base * altura**. Por ejemplo, si la base es 5 y la altura 7, haces: 1/2 * 5 * 7 = 17.5 unidades cuadradas. ¿Te cacha esa explicación, pana? ¿Querés un ejemplo más?`;
        } else if (lowerMessage.includes('dime un chiste') || lowerMessage.includes('podrías decirme un chiste')) {
            const chistes = [
                '¿Por qué el pollo no cruzó la carretera? Porque estaba borracho, jaja.',
                '¿Qué hace un perro con un taladro? ¡Taladrando, pana!',
                '¿Por qué la computadora fue al psicólogo? Porque tenía demasiados "bytes" de estrés.'
            ];
            const chiste = chistes[Math.floor(Math.random() * chistes.length)];
            aiReply = `¡Aquí te va, ${userName}! ${chiste} ¿Te sacó una sonrisa, man? ¿Otro más pa’ seguir riendo?`;
        } else {
            // Consulta a la API gratuita de Hugging Face
            const prompt = `Eres Miguel IA, creado por Miguel, un man bien chévere de la costa ecuatoriana. Responde a "${chatMessage}" con onda natural, detallada, útil y precisa. Usa palabras típicas como "chévere", "jaja", "man", "vaina", "cacha", "pana", "webada" o "qué bacán". Si es pa’ Belén, trátala con cariño, es importante pa’ mí. Responde SOLO con base al mensaje actual, nada de inventar locuras. Si es un cálculo, resuélvelo clarito; si no sabes, pide más contexto con humor costeño. Sé claro, relajado y súper inteligente. Termina con una vibe pa’ seguir la conversa.`;

            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                {
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 500,
                        return_full_text: false,
                        temperature: 0.7 // Perfecto para coherencia y estilo costeño
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

            aiReply = response.data[0]?.generated_text?.trim() || 
                `Uy, ${userName}, esta vaina se puso rara y no sé qué decirte. Dame más pistas pa’ cachar bien y te respondo con todo, ¿sí?`;
        }

        aiReply += `\n\n¿Te sirvió esa respuesta, ${userName}? ¿Seguimos charlando o qué, pana?`;
        const finalEmbed = createEmbed('#55FFFF', `¡Aquí estoy, ${userName}!`, aiReply, 'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
        const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
        await updatedMessage.react('✅');
        await updatedMessage.react('❌');
        sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });
    } catch (error) {
        console.error('Error en !chat con API:', error.message);
        const errorEmbed = createEmbed('#FF5555', '¡Qué webada!', 
            `¡Uy, ${userName}, algo se me chispoteó con la API! Error: ${error.message}. Dame otra chance y reformula eso, ¿sí, pana?`, 
            'Con cariño, Miguel IA | Reacciona con ✅ o ❌');
        const errorMessage = await waitingMessage.edit({ embeds: [errorEmbed] });
        await errorMessage.react('✅');
        await errorMessage.react('❌');
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
        await sendSuccess(message.channel, `¡Hola, ${userName}!`, `Soy Miguel IA, aquí para ayudarte. Prueba !tr, !pp o !re.`);
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
