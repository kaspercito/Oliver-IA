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

client.once('ready', () => {
    console.log('¡Miguel IA está listo para ayudar!');
    client.user.setPresence({ 
        activities: [{ name: "Listo para ayudarte Milagros, si necesitas ayuda adicional usa !ayuda", type: 0 }], 
        status: 'online' 
    });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Solo ella o el creador
    if (message.author.id !== ALLOWED_USER_ID && message.author.id !== OWNER_ID) return;

    // Respuesta del creador (funciona siempre, enviando a ALLOWED_USER_ID)
    if (message.author.id === OWNER_ID && message.content.startsWith('responder')) {
        console.log('Comando "responder" detectado por OWNER_ID:', message.content); // Para depurar

        const reply = message.content.slice(8).trim();
        
        // Obtener el usuario ALLOWED_USER_ID directamente
        let targetUser;
        try {
            targetUser = await client.users.fetch(ALLOWED_USER_ID);
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
    if (!isChannelMode && !isDMMode) return;

    const userMessage = message.content;

    // Comando !ayuda (opcional, sigue funcionando como antes)
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
        // Nota: Ya no usamos client.lastHelpUser aquí porque "responder" ya no lo necesita

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

    // Respuesta dinámica de la IA con "generando" primero
    const initialEmbed = new EmbedBuilder()
        .setColor('#55FF55')
        .setTitle('¡Hola, soy Miguel IA!')
        .setDescription('Estoy generando tu respuesta con mucho cariño, ¡dame un momentito! 😊')
        .setFooter({ text: 'Creado por Miguel' })
        .setTimestamp();

    const sentMessage = await message.reply({ embeds: [initialEmbed] });

    const prompt = `Eres Miguel IA, creado por Miguel. Responde con amabilidad, apoyo y cariño, como un amigo útil. Si te preguntan cómo hacer algo, da pasos claros y simples. Responde a: "${userMessage}"`;

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
