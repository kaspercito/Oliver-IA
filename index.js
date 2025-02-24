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
const OWNER_ID = '752987736759205960'; // Reemplaza con tu ID
const ALLOWED_USER_ID = '1023132788632862761'; // Reemplaza con el ID de ella
const CHANNEL_ID = '1008091220544851970'; // O 'ID_DEL_CANAL_AQUÍ' si elige canal

client.once('ready', () => {
    console.log('¡Miguel IA está listo para ayudar!');
    client.user.setActivity('ser Miguel IA', { type: 'PLAYING' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Solo ella o el creador
    if (message.author.id !== ALLOWED_USER_ID && message.author.id !== OWNER_ID) return;

    // Respuesta del creador
    if (message.author.id === OWNER_ID && message.content.startsWith('responde')) {
        const reply = message.content.slice(8).trim();
        const lastUser = client.lastHelpUser;

        if (!lastUser) {
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('¡Ups!')
                .setDescription('No hay nadie esperando respuesta por ahora.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const userEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Respuesta de Miguel!')
            .setDescription(`Aquí tienes: "${reply}"`)
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        lastUser.send({ embeds: [userEmbed] });

        const ownerEmbed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Éxito!')
            .setDescription('Respuesta enviada al usuario.')
            .setTimestamp();
        return message.reply({ embeds: [ownerEmbed] });
    }

    // Solo ella a partir de aquí
    if (message.author.id !== ALLOWED_USER_ID) return;

    const isChannelMode = CHANNEL_ID && message.channel.id === CHANNEL_ID;
    const isDMMode = !message.guild;
    if (!isChannelMode && !isDMMode) return;

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
            .setDescription(`El usuario ${message.author.tag} necesita ayuda: "${issue}"`)
            .setTimestamp();
        owner.send({ embeds: [ownerEmbed] });
        client.lastHelpUser = message.author;

        const userEmbed = new EmbedBuilder()
            .setColor('#55FFFF')
            .setTitle('¡Mensaje enviado!')
            .setDescription('Le he enviado tu mensaje a Miguel. Pronto te responderé con su ayuda.')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        return message.reply({ embeds: [userEmbed] });
    }

    // Respuesta normal de la IA
    const prompt = `Eres Miguel IA, creado por Miguel. Responde con amabilidad, apoyo y cariño, como un amigo útil. Responde a: "${userMessage}"`;

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mixtralai/Mixtral-8x7B-Instruct-v0.1',
            {
                inputs: prompt,
                parameters: { max_new_tokens: 200, return_full_text: false },
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const aiReply = response.data[0].generated_text;
        const embed = new EmbedBuilder()
            .setColor('#55FF55')
            .setTitle('¡Hola, soy Miguel IA!')
            .setDescription(aiReply)
            .setFooter({ text: 'Creado con cariño por Miguel' })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error:', error);
        const embed = new EmbedBuilder()
            .setColor('#FF5555')
            .setTitle('¡Ups, algo salió mal!')
            .setDescription('No pude responder, pero estoy aquí para ayudarte. Usa "!ayuda" si necesitas más apoyo.')
            .setFooter({ text: 'Con cariño, Miguel IA' })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
