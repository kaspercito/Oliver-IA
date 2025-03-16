// Ayuda
async function manejarAyuda(message) {
    // Comando pa’ pedir ayuda a Miguel, re útil pa’ Belén
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    // Saco el problema del mensaje, dependiendo si usaste !ayuda o !ay
    const issue = message.content.startsWith('!ayuda') ? message.content.slice(6).trim() : message.content.slice(3).trim();
    // Si no escribiste nada, te pido algo en rojo
    if (!issue) {
        return sendError(message.channel, `Dime qué necesitas después de "!ay", ${userName}.`);
    }

    // Busco a Miguel pa’ mandarle el pedido por MD
    const owner = await client.users.fetch(OWNER_ID);
    // Chequeo si hay adjuntos pa’ incluirlos
    const attachments = message.attachments.size > 0 ? message.attachments.map(att => att.url) : [];
    // Armo un embed dorado con el problema y los adjuntos si hay
    const ownerEmbed = createEmbed('#FF1493', '¡Solicitud de ayuda!',
        `${userName} necesita ayuda con: "${issue}"\n` +
        (attachments.length > 0 ? `Imágenes adjuntas:\n${attachments.join('\n')}` : 'Sin imágenes adjuntas.') +
        `\nUsá !responder en cualquier canal para contestarle por MD, loco.`);

    try {
        // Le mando el embed a Miguel
        const sentToOwner = await owner.send({ embeds: [ownerEmbed] });
        // Guardo el mensaje en sentMessages pa’ que Miguel pueda responder
        sentMessages.set(sentToOwner.id, { 
            type: 'help', 
            issue, 
            channelId: message.channel.id, 
            userId: message.author.id, 
            attachments, 
            timestamp: Date.now() 
        });

        // Te confirmo en verde que el pedido llegó a Miguel
        await sendSuccess(message.channel, '¡Ayuda en camino!',
            `Ya le avisé a Miguel, ${userName}. ¡Si te responde con !responder, lo vas a ver por MD, grosa!`);
    } catch (error) {
        // Si falla el envío, te aviso en rojo
        console.error('Error al enviar ayuda:', error);
        await sendError(message.channel, 'No pude avisar a Miguel', `Ocurrió un error, ${userName}. ¿Intentamos de nuevo?`);
    }
}

module.exports = { manejarAyuda };
