// Cambiar el avatar del bot
async function manejarAvatar(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    const args = message.content.toLowerCase().startsWith('!avatar') 
        ? message.content.slice(7).trim() 
        : message.content.slice(3).trim();
    let imageUrl = args;

    // Si no hay URL, miro si hay un adjunto
    if (!imageUrl && message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
    }

    // Si no hay ni URL ni adjunto, doy instrucciones claras
    if (!imageUrl) {
        const instruccionesEmbed = createEmbed('#FF1493', `¡Pará, ${userName}! ¿Y la imagen?`, 
            'Para cambiar mi foto, hacé esto:\n' +
            '1. **Con URL**: Usá `!avatar [URL]`, como `!avatar https://ejemplo.com/imagen.jpg`.\n' +
            '2. **Con adjunto**: Subí una imagen (clic en "+" > "Subir un archivo") y escribí `!avatar` en el mismo mensaje.\n' +
            '¡Probá de nuevo, loco! La imagen tiene que ser .jpg, .png o algo así, y no más de 10 MB.');
        return message.channel.send({ embeds: [instruccionesEmbed] });
    }

    // Aviso que estoy procesando
    const waitingEmbed = createEmbed('#FF1493', `⌛ Cambiando look, ${userName}...`, 
        'Aguantá un toque que me pongo lindo...');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        // Descargo la imagen con axios
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Cambio el avatar del bot
        await client.user.setAvatar(imageBuffer);
        
        // Confirmo el cambio con éxito
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

module.exports = { manejarAvatar };
