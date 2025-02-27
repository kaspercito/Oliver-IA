const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// IDs
const OWNER_ID = '752987736759205960'; // Tu ID
const ALLOWED_USER_ID = '1023132788632862761'; // ID de ella
const CHANNEL_ID = '1343749554905940058'; // Canal permitido

// Configuración del historial
const HISTORY_FILE = './conversationHistory.json';
const MAX_MESSAGES = 20;

// Lista de actualizaciones
const BOT_UPDATES = [
    'Añadido el comando `!trivia` para jugar preguntas de trivia con categorías como cine, música, historia, etc.',
    'Implementado el comando `!help` para mostrar una lista de comandos disponibles.',
    'Mejorada la interacción para ser más amigable y útil con respuestas dinámicas.',
    'El bot ahora incluye un historial de conversaciones que se muestra al iniciar.',
    'Añadido el comando `!sugerencias` para que Milagros pueda proponer ideas.',
];

// Mapa de categorías para trivia
const categoriasTrivia = {
    cine: 11,      // Film
    musica: 12,    // Music
    libros: 10,    // Books
    historia: 23,  // History
    ciencia: 17,   // Science & Nature
    general: 9,    // General Knowledge
    arte: 25,      // Art
};

// Cargar historial desde JSON
function loadConversationHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Error al cargar el historial:', error);
        return {};
    }
}

// Guardar historial en JSON
function saveConversationHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
        console.log('Historial guardado en', HISTORY_FILE);
    } catch (error) {
        console.error('Error al guardar el historial:', error);
    }
}

let conversationHistory = loadConversationHistory();

// Función para obtener una pregunta de trivia
async function obtenerPreguntaTrivia(categoria = null) {
    const categoriaId = categoria && categoriasTrivia[categoria.toLowerCase()]
        ? categoriasTrivia[categoria.toLowerCase()]
        : Object.values(categoriasTrivia)[Math.floor(Math.random() * Object.values(categoriasTrivia).length)];
    const url = `https://opentdb.com/api.php?amount=1&category=${categoriaId}&type=multiple`;

    try {
        const response = await axios.get(url);
        const pregunta = response.data.results[0];
        const opciones = [...pregunta.incorrect_answers, pregunta.correct_answer];
        for (let i = opciones.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
        }
        return {
            pregunta: pregunta.question,
            opciones: opciones,
            respuesta: pregunta.correct_answer
        };
    } catch (error) {
        console.error("Error al obtener pregunta de trivia:", error);
        return null;
    }
}

// Función para manejar el juego de trivia
async function manejarTrivia(message, categoria = null) {
    const trivia = await obtenerPreguntaTrivia(categoria);
    if (!trivia) {
        const embedError = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('¡Ups!')
            .setDescription('No pude obtener una pregunta. ¿Quieres intentarlo de nuevo o prefieres que te ayude con algo más?')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return message.channel.send({ embeds: [embedError] });
    }

    const embedPregunta = new EmbedBuilder()
        .setColor('#55FFFF')
        .setTitle('🎲 ¡Pregunta de Trivia!')
        .setDescription(`${trivia.pregunta}\n\n` +
            `**A)** ${trivia.opciones[0]}\n` +
            `**B)** ${trivia.opciones[1]}\n` +
            `**C)** ${trivia.opciones[2]}\n` +
            `**D)** ${trivia.opciones[3]}`)
        .setFooter({ text: 'Tienes 15 segundos para responder con A, B, C o D | Con cariño, Miguel IA' })
        .setTimestamp();

    await message.channel.send({ embeds: [embedPregunta] });

    const opcionesValidas = ["a", "b", "c", "d"];
    const indiceCorrecto = trivia.opciones.indexOf(trivia.respuesta);
    const letraCorrecta = opcionesValidas[indiceCorrecto];
    const filtro = (respuesta) => opcionesValidas.includes(respuesta.content.toLowerCase());
    const tiempoInicio = Date.now();

    try {
        const respuestas = await message.channel.awaitMessages({
            filter: filtro,
            max: 1,
            time: 15000,
            errors: ["time"]
        });

        const respuestaUsuario = respuestas.first().content.toLowerCase();
        const ganador = respuestas.first().author;
        const tiempoFinal = (Date.now() - tiempoInicio) / 1000;

        if (respuestaUsuario === letraCorrecta) {
            const embedCorrecto = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('🎉 ¡Correcto!')
                .setDescription(`**${ganador.tag} respondió correctamente en ${tiempoFinal.toFixed(2)} segundos.**\n\n` +
                    `✅ La respuesta correcta era: **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()})`)
                .setFooter({ text: '¡Eres increíble! | Con cariño, Miguel IA' })
                .setTimestamp();
            message.channel.send({ embeds: [embedCorrecto] });
        } else {
            const embedIncorrecto = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('❌ ¡Oh, no!')
                .setDescription(`**${ganador.tag}**, tu respuesta no fue correcta, pero ¡no te rindas!\n\n` +
                    `✅ La respuesta correcta era: **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()})`)
                .setFooter({ text: '¡Sigue intentándolo! | Con cariño, Miguel IA' })
                .setTimestamp();
            message.channel.send({ embeds: [embedIncorrecto] });
        }
    } catch (error) {
        const embedTiempo = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('⏳ ¡Tiempo agotado!')
            .setDescription(`Nadie respondió a tiempo... La respuesta correcta era: **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}). ¿Quieres otra ronda? Usa !trivia.`)
            .setFooter({ text: '¡Estoy aquí para ti! | Con cariño, Miguel IA' })
            .setTimestamp();
        message.channel.send({ embeds: [embedTiempo] });
    }
}

client.once('ready', async () => {
    console.log('¡Miguel IA está listo para ayudar!');
    client.user.setPresence({ 
        activities: [{ name: "Listo para ayudarte Milagros, usa !ayuda o !help si necesitas algo", type: 0 }], 
        status: 'online' 
    });

    // Enviar actualizaciones con historial al canal al iniciar, solo si no se envió antes
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) {
            console.error('No se pudo encontrar el canal para enviar actualizaciones:', CHANNEL_ID);
            return;
        }

        const messages = await channel.messages.fetch({ limit: 50 });
        const updateExists = messages.some(msg => 
            msg.author.id === client.user.id && 
            msg.embeds.length > 0 && 
            msg.embeds[0].title === '📢 Actualizaciones de Miguel IA'
        );

        if (updateExists) {
            console.log('Ya existe un mensaje de actualización en el canal, no se enviará de nuevo.');
            return;
        }

        const userHistory = conversationHistory[ALLOWED_USER_ID] || [];
        const historySummary = userHistory.length > 0
            ? userHistory.slice(-3).map(msg => `${msg.role === 'user' ? 'Milagros' : 'Yo'}: ${msg.content}`).join('\n')
            : 'No hay historial reciente.';

        const updateEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📢 Actualizaciones de Miguel IA')
            .setDescription('¡Hola! Estoy aquí con nuevas funciones y un vistazo a nuestras últimas charlas:')
            .addFields(
                { name: 'Novedades', value: BOT_UPDATES.map(update => `- ${update}`).join('\n') || 'No hay actualizaciones nuevas.' },
                { name: 'Últimas conversaciones', value: historySummary }
            )
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();

        await channel.send({ embeds: [updateEmbed] });
        console.log('Actualizaciones con historial enviadas al canal:', CHANNEL_ID);
    } catch (error) {
        console.error('Error al enviar actualizaciones al canal:', error);
    }
});

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
        if (userHistory.length > MAX_MESSAGES) {
            userHistory.shift();
        }
        conversationHistory[userId] = userHistory;
        saveConversationHistory(conversationHistory);
    }

    if (message.author.id === OWNER_ID && message.content.startsWith('responder')) {
        const reply = message.content.slice(9).trim();
        if (!reply) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('Por favor, escribe algo después de "responder" para enviar a Milagros.')
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
                .setDescription('No pude encontrar a Milagros. ¿Está bien su ID o me bloqueó?')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const userEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Respuesta de Miguel!')
            .setDescription(`Aquí tienes: "${reply}"`)
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();

        if (message.attachments.size > 0) {
            const attachments = message.attachments.map(attachment => attachment.url);
            userEmbed.addFields({
                name: 'Imágenes de Miguel',
                value: attachments.join('\n'),
                inline: false
            });
            const firstAttachment = message.attachments.first();
            if (firstAttachment && firstAttachment.contentType?.startsWith('image/')) {
                userEmbed.setImage(firstAttachment.url);
            }
        }

        try {
            await targetUser.send({ embeds: [userEmbed] });
            console.log('Mensaje enviado a ALLOWED_USER_ID:', reply);
            const ownerEmbed = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('¡Éxito!')
                .setDescription('Respuesta enviada a Milagros con cariño.')
                .setTimestamp();
            await message.reply({ embeds: [ownerEmbed] });
        } catch (error) {
            console.error('Error al enviar respuesta al usuario:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude enviarle esto a Milagros. ¿Me bloqueó o hay un problema con Discord?')
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
            .setFooter({ text: 'Con cariño, Miguel IA' })
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
                .setDescription('No pude enviar la actualización al canal. ¡Lo siento!')
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

    if (userMessage.startsWith('!ayuda')) {
        const issue = userMessage.slice(6).trim();
        if (!issue) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Un momento!')
                .setDescription('Dime qué necesitas después de "!ayuda" y te ayudaré con todo mi cariño.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const owner = await client.users.fetch(OWNER_ID);
        const ownerEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('¡Solicitud de ayuda!')
            .setDescription(`Milagros necesita ayuda: "${issue}"`)
            .setTimestamp();

        if (message.attachments.size > 0) {
            const attachments = message.attachments.map(attachment => attachment.url);
            ownerEmbed.addFields({
                name: 'Adjuntos',
                value: attachments.join('\n') || 'No se pudieron cargar los enlaces.',
                inline: false
            });
            const firstAttachment = message.attachments.first();
            if (firstAttachment && firstAttachment.contentType?.startsWith('image/')) {
                ownerEmbed.setImage(firstAttachment.url);
            }
        }

        await owner.send({ embeds: [ownerEmbed] });

        const userEmbed = new EmbedBuilder()
            .setColor('#55FFFF')
            .setTitle('¡Mensaje enviado!')
            .setDescription('Ya le conté a Miguel lo que necesitas. Pronto te ayudaré con su respuesta.')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [userEmbed] });
    }

    if (userMessage.startsWith('!help')) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Aquí tienes mis comandos!')
            .setDescription('Estoy listo para ayudarte con estas opciones:')
            .addFields(
                { name: '!ayuda <problema>', value: 'Pídele ayuda a Miguel con un mensaje o imagen si necesitas algo especial.' },
                { name: '!help', value: 'Te muestro esta lista para que sepas cómo jugar conmigo.' },
                { name: '!trivia [categoría]', value: 'Juega una trivia divertida. Usa cine, musica, libros, historia, ciencia, general o arte (opcional).' },
                { name: '!sugerencias <idea>', value: 'Comparte tus ideas para mejorar el bot, ¡las enviaré a Miguel!' },
                { name: 'hola', value: 'Salúdame y te daré una bienvenida muy especial.' },
                { name: 'Cualquier mensaje', value: 'Chatea conmigo como amigo, ¡siempre tendré algo útil o divertido para decirte!' }
            )
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [helpEmbed] });
    }

    if (userMessage.startsWith('!sugerencias')) {
        const suggestion = userMessage.slice(12).trim();
        if (!suggestion) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Un momento!')
                .setDescription('Por favor, escribe tu sugerencia después de "!sugerencias". ¡Quiero escuchar tus ideas!')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const owner = await client.users.fetch(OWNER_ID);
        const ownerEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💡 Nueva sugerencia de Milagros')
            .setDescription(`Milagros propone: "${suggestion}"`)
            .setTimestamp();

        try {
            await owner.send({ embeds: [ownerEmbed] });
            const userEmbed = new EmbedBuilder()
                .setColor('#55FF55')
                .setTitle('¡Sugerencia enviada!')
                .setDescription('Tu idea ya está con Miguel. ¡Gracias por ayudarme a mejorar!')
                .setFooter({ text: 'Con cariño, Miguel IA' })
                .setTimestamp();
            return message.reply({ embeds: [userEmbed] });
        } catch (error) {
            console.error('Error al enviar sugerencia al propietario:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude enviar tu sugerencia a Miguel. ¿Quieres intentarlo de nuevo o usar "!ayuda"?')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    }

    if (userMessage.startsWith('!trivia')) {
        console.log('Trivia activada por:', message.author.tag);

        const args = userMessage.split(' ').slice(1);
        const categoria = args.length > 0 ? args[0] : null;

        if (categoria && !categoriasTrivia[categoria.toLowerCase()]) {
            const embedError = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription(`No conozco la categoría "${categoria}". Prueba con: ${Object.keys(categoriasTrivia).join(', ')}`)
                .setFooter({ text: 'O usa "!trivia" para algo random | Con cariño, Miguel IA' })
                .setTimestamp();
            return message.channel.send({ embeds: [embedError] });
        }

        await manejarTrivia(message, categoria);
        return;
    }

    if (userMessage.toLowerCase() === 'hola') {
        const embed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Hola, qué alegría verte!')
            .setDescription(
                'Soy Miguel IA, creado por Miguel para estar siempre contigo. Puedo ayudarte con cualquier duda, charlar como amigo o incluso jugar una trivia. Si necesitas algo especial, usa "!ayuda" o comparte tus ideas con "!sugerencias". ¿Qué tienes en mente hoy?'
            )
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    const initialEmbed = new EmbedBuilder()
        .setColor('#55FF55')
        .setTitle('¡Hola, soy Miguel IA!')
        .setDescription('Estoy pensando en la mejor forma de ayudarte, ¡un segundo! 😊')
        .setFooter({ text: 'Con cariño, Miguel IA' })
        .setTimestamp();

    const sentMessage = await message.reply({ embeds: [initialEmbed] });

    const userHistory = conversationHistory[ALLOWED_USER_ID] || [];
    const historyText = userHistory.map(msg => `${msg.role === 'user' ? 'Tú' : 'Yo'}: ${msg.content}`).join('\n');

    const prompt = `Eres Miguel IA, creado por Miguel. Tu misión es ayudar a Milagros con cariño, inteligencia y paciencia. Responde como un amigo cercano: sé claro, útil y proactivo. Si pregunta cómo hacer algo, da pasos prácticos y simples. Si no está claro qué necesita, haz una suposición razonable y ofrece ayuda. No uses prefijos como "con:" o "con"; responde directamente con un mensaje natural. Siempre termina con una nota positiva o una sugerencia para seguir charlando. Aquí está el historial (úsalo para el contexto, no lo cites):\n${historyText}\n\nMilagros dijo: ${userMessage}\nTu respuesta:`;

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
            {
                inputs: prompt,
                parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.7 },
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
        if (!aiReply || aiReply.trim().length < 10) {
            aiReply = 'No estoy seguro de cómo ayudarte con eso, pero quiero hacerlo. ¿Puedes darme más detalles? Mientras tanto, ¿te gustaría jugar una trivia con "!trivia" o compartir una idea con "!sugerencias"?';
        }

        let updatedHistory = conversationHistory[ALLOWED_USER_ID] || [];
        updatedHistory.push({
            role: 'assistant',
            content: aiReply,
            timestamp: new Date().toISOString()
        });
        if (updatedHistory.length > MAX_MESSAGES) {
            updatedHistory.shift();
        }
        conversationHistory[ALLOWED_USER_ID] = updatedHistory;
        saveConversationHistory(conversationHistory);

        const finalEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Aquí estoy para ti!')
            .setDescription(aiReply)
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();

        return sentMessage.edit({ embeds: [finalEmbed] });
    } catch (error) {
        console.error('Error al consultar la API:', error.message, error.response?.data || '');
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('¡Ay, algo no salió bien!')
            .setDescription('No pude encontrar la respuesta perfecta esta vez, pero no te preocupes, estoy aquí para ti. ¿Quieres usar "!ayuda" para que Miguel me eche una mano, o prefieres intentar con otra pregunta?')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return sentMessage.edit({ embeds: [errorEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
