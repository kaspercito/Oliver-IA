// Sugerencias
async function manejarSugerencias(message) {
    // Comando pa’ que Belén tire ideas zarpadas pa’ mejorar el bot
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    // Saco la sugerencia del mensaje, dependiendo si usaste !sugerencias o !su
    const suggestion = message.content.startsWith('!sugerencias') ? message.content.slice(12).trim() : message.content.slice(4).trim();
    // Si no escribiste nada, te pido algo en rojo
    if (!suggestion) {
        return sendError(message.channel, `Escribe tu sugerencia después de "!su", ${userName}. ¡Quiero escuchar tus ideas!`);
    }

    // Busco a Miguel pa’ mandarle la idea por MD
    const owner = await client.users.fetch(OWNER_ID);
    // Armo un embed dorado pa’ Miguel con la sugerencia
    const ownerEmbed = createEmbed('#FF1493', '💡 Nueva sugerencia de Belén',
        `${userName} propone: "${suggestion}"\nReacciona con ✅ para dar visto, loco.\nUsá !responder en cualquier canal para contestarle por MD.`);

    try {
        // Le mando el embed a Miguel y le pongo una reacción
        const sentToOwner = await owner.send({ embeds: [ownerEmbed] });
        await sentToOwner.react('✅');
        // Guardo el mensaje en sentMessages pa’ que Miguel pueda responder después
        sentMessages.set(sentToOwner.id, { 
            type: 'suggestion', 
            suggestion, 
            channelId: message.channel.id, 
            userId: message.author.id, 
            timestamp: Date.now() 
        });

        // Te confirmo en verde que la idea llegó a Miguel
        await sendSuccess(message.channel, '¡Sugerencia enviada!',
            `Tu idea ya está con Miguel, ${userName}. ¡Si le da el visto o te responde con !responder, te llega por MD, genia!`);
    } catch (error) {
        // Si falla el envío, te aviso en rojo
        console.error('Error al enviar sugerencia:', error);
        await sendError(message.channel, 'No pude enviar tu sugerencia', `Ocurrió un error, ${userName}. ¿Intentamos de nuevo?`);
    }
}

module.exports = { manejarSugerencias };
