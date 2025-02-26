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

// Historial de conversación en memoria
const conversationHistory = new Map(); // Usamos Map para asociar usuarios con su historial
const MAX_MESSAGES = 20; // Límite de mensajes guardados por usuario

client.once('ready', () => {
    console.log('¡Miguel IA está listo para ayudar!');
    client.user.setPresence({ 
        activities: [{ name: "Listo para ayudarte Milagros, si necesitas ayuda adicional usa !ayuda", type: 0 }], 
        status: 'online' 
    });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Depuración inicial
    console.log('Mensaje recibido - Autor:', message.author.id, 'Contenido:', message.content, 'Es DM:', !message.guild);

    // Solo ella o el creador
    if (message.author.id !== ALLOWED_USER_ID && message.author.id !== OWNER_ID) {
        console.log('Mensaje ignorado - ID no permitido:', message.author.id);
        return;
    }

    // Guardar mensaje en el historial (solo para ALLOWED_USER_ID)
    if (message.author.id === ALLOWED_USER_ID) {
        const userId = message.author.id;
        let userHistory = conversationHistory.get(userId) || [];
        userHistory.push({
            role: 'user',
            content: message.content,
            timestamp: new Date().toISOString()
        });
        if (userHistory.length > MAX_MESSAGES) {
            userHistory.shift(); // Elimina el mensaje más antiguo si supera el límite
        }
        conversationHistory.set(userId, userHistory);
    }

    // Respuesta del creador (funciona en canales y DMs)
    if (message.author.id === OWNER_ID && message.content.startsWith('responder')) {
        console.log('Comando "responder" detectado por OWNER_ID:', message.content, 'Desde DM:', !message.guild);

        const reply = message.content.slice(8).trim();
        if (!reply) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('Por favor, escribe algo después de "responder" para enviar a Milagros.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Obtener el usuario ALLOWED_USER_ID directamente
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
                .setDescription('Respuesta enviada a Milagros.')
                .setTimestamp();
            await message.reply({ embeds: [ownerEmbed] });
        } catch (error) {
            console.error('Error al enviar respuesta al usuario:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No pude enviar la respuesta a Milagros. ¿Quizás me bloqueó o hay un problema con Discord?')
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed] });
        }
        return;
    }

    // Solo ella a partir de aquí
    if (message.author.id !== ALLOWED_USER_ID) return;

    const isChannelMode = CHANNEL_ID && message.channel.id === CHANNEL_ID;
    const isDMMode = !message.guild;
    if (!isChannelMode && !isDMMode) {
        console.log('Mensaje ignorado - Canal no permitido:', message.channel.id);
        return;
    }

    const userMessage = message.content;

    // Comando !ayuda
    if (userMessage.startsWith('!ayuda')) {
        const issue = userMessage.slice(6).trim();
        if (!issue) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Espera un momento!')
                .setDescription('Por favor, dime qué necesitas ayuda con después de "!ayuda".')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const owner = await client.users.fetch(OWNER_ID);
        const ownerEmbed = new EmbedBuilder()
            .setColor('#FFFF55')
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
            .setDescription('Le he enviado tu mensaje a Miguel. Pronto te responderé con su ayuda.')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [userEmbed] });
    }

    // Respuesta a "hola"
    if (userMessage.toLowerCase() === 'hola') {
        const embed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Hola, soy Miguel IA!')
            .setDescription(
                '¡Hola, qué alegría verte! Soy Miguel IA, creado por Miguel para ayudarte con cariño y apoyo. Puedo responder tus preguntas, darte información y hasta charlar como amigo. Si no te puedo ayudar yo, solo di "!ayuda" y le contaré a Miguel. ¿En qué puedo ayudarte hoy?'
            )
            .setFooter({ text: 'Creado por Miguel' })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // Respuesta dinámica de la IA con historial
    const initialEmbed = new EmbedBuilder()
        .setColor('#55FF55')
        .setTitle('¡Hola, soy Miguel IA!')
        .setDescription('Estoy generando tu respuesta con mucho cariño, ¡dame un momentito! 😊')
        .setFooter({ text: 'Creado por Miguel' })
        .setTimestamp();

    const sentMessage = await message.reply({ embeds: [initialEmbed] });

    // Obtener historial del usuario
    const userHistory = conversationHistory.get(ALLOWED_USER_ID) || [];
    const historyText = userHistory.map(msg => `${msg.role === 'user' ? 'Milagros' : 'Miguel IA'}: ${msg.content}`).join('\n');

    const prompt = `Eres Miguel IA, creado por Miguel. Responde con amabilidad, apoyo y cariño, como un amigo útil. Si te preguntan cómo hacer algo, da pasos claros y simples. Aquí está el historial de la conversación:\n${historyText}\nResponde a: "${userMessage}"`;

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

        const aiReply = response.data[0]?.generated_text || '¡Ups, parece que me quedé pensando! ¿Puedes repetir tu pregunta?';

        if (!aiReply || aiReply.trim().length < 5) {
            throw new Error('Respuesta vacía o insuficiente');
        }

        // Guardar la respuesta de la IA en el historial
        let updatedHistory = conversationHistory.get(ALLOWED_USER_ID) || [];
        updatedHistory.push({
            role: 'assistant',
            content: aiReply,
            timestamp: new Date().toISOString()
        });
        if (updatedHistory.length > MAX_MESSAGES) {
            updatedHistory.shift(); // Elimina el mensaje más antiguo
        }
        conversationHistory.set(ALLOWED_USER_ID, updatedHistory);

        const finalEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Hola, soy Miguel IA!')
            .setDescription(aiReply)
            .setFooter({ text: 'Creado con cariño por Miguel' })
            .setTimestamp();

        return sentMessage.edit({ embeds: [finalEmbed] });
    } catch (error) {
        console.error('Error al consultar la API:', error.message, error.response?.data || '');
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('¡Ups, algo salió mal!')
            .setDescription('No pude generar la respuesta esta vez, pero estoy aquí para ayudarte. Usa "!ayuda" si necesitas que Miguel me dé una mano.')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return sentMessage.edit({ embeds: [errorEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
