// Responder
async function manejarResponder(message) {
    // Comando solo pa’ Miguel pa’ responderle a Belén por MD
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    // Si no sos Miguel, chau, no podés usarlo
    if (message.author.id !== OWNER_ID) return;

    // Logueo pa’ debug, pa’ ver qué pasa
    console.log(`[${instanceId}] Ejecutando !responder por ${userName} con contenido: "${message.content}"`);

    // Saco el mensaje después de !responder
    const args = message.content.slice(10).trim();
    // Si no escribiste nada, te pido algo en rojo
    if (!args) {
        console.log(`[${instanceId}] Error: No hay argumentos en !responder`);
        return sendError(message.channel, `Escribí algo después de "!responder", ${userName}. ¿Qué le querés decir a Belén por MD?`);
    }

    // Busco a Belén pa’ mandarle el mensaje
    let belen;
    try {
        belen = await client.users.fetch(ALLOWED_USER_ID);
        console.log(`[${instanceId}] Usuario Belén (${ALLOWED_USER_ID}) obtenido con éxito`);
    } catch (error) {
        // Si no la encuentro, te aviso en rojo
        console.error(`[${instanceId}] Error al obtener usuario Belén: ${error.message}`);
        return sendError(message.channel, '❌ ¡No pude encontrar a Belén!', `Error: ${error.message}, ${userName}.`);
    }

    // Chequeo si hay adjuntos pa’ incluirlos
    const attachments = message.attachments.size > 0 ? message.attachments.map(att => ({ attachment: att.url })) : [];
    console.log(`[${instanceId}] Preparando envío a Belén (${ALLOWED_USER_ID}), adjuntos: ${attachments.length}`);

    try {
        // Armo un embed dorado con tu mensaje
        const responseEmbed = createEmbed('#FF1493', '📬 Mensaje de Miguel',
            `Miguel dice: "${args || 'Sin texto, pero mirá las imágenes si hay.'}"`);
        
        // Le mando el mensaje a Belén por MD con los adjuntos si hay
        console.log(`[${instanceId}] Enviando mensaje a Belén...`);
        await belen.send({ embeds: [responseEmbed], files: attachments });
        console.log(`[${instanceId}] Mensaje enviado exitosamente a Belén`);

        // Te confirmo en verde que salió todo bien
        await sendSuccess(message.channel, '✅ ¡Respuesta enviada!',
            `Le mandé tu mensaje a Belén por MD, ${userName}. ¡Ya lo va a ver, loco!`);
    } catch (error) {
        // Si falla el envío, te aviso en rojo
        console.error(`[${instanceId}] Error al enviar mensaje por MD: ${error.message}`);
        await sendError(message.channel, '❌ ¡No pude mandarle el MD a Belén!',
            `Algo falló, ${userName}. Error: ${error.message}. ¿Belén tiene los MD abiertos para el bot?`);
    }
}

module.exports = { manejarResponder };
