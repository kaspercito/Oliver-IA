// Genero imágenes con Puppeteer y Axios, una locura que me tiré a hacer
async function generateImage(prompt, style) {
    const maxRetries = 3; // Le doy 3 chances antes de rendirme
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            console.log(`Generando imagen para: "${prompt}" en estilo ${style} - Intento ${attempt + 1}`);
            const fullPrompt = `Una imagen copada de ${prompt}, estilo ${style}, con onda argentina, 4k, detalles zarpados`;
            const response = await axios.post(API_URL, {
                inputs: fullPrompt,
                parameters: {
                    negative_prompt: "borroso, feo, baja calidad, distorsionado", // Nada de porquerías
                    num_inference_steps: 50,
                    guidance_scale: 7.5
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer' // Lo quiero en crudo
            });

            const imageBase64 = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
            return imageBase64; // ¡Listo, una obra maestra!
        } catch (error) {
            attempt++;
            console.error(`Error al generar imagen (intento ${attempt}):`, error.response?.status, error.message);
            if (attempt === maxRetries) {
                throw new Error(`No pude generar la imagen después de ${maxRetries} intentos: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Espero más cada vez
        }
    }
}

module.exports = { generateImage };

// Manejo el comando !imagen pa’ que Miguel y Belén pidan dibujitos
async function manejarImagen(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const content = message.content.slice(3).trim().toLowerCase();
    const [prompt, style = 'realista'] = content.split(',').map(s => s.trim());

    if (!prompt) {
        return sendError(message.channel, `¡Tirame algo pa’ imaginar, ${userName}! Ej: !im un mate, realista`);
    }

    const waitingEmbed = createEmbed('#FF1493', `¡Pará un cacho, ${userName}!`, 
        'Estoy generando tu imagen con onda...'); // Celeste pa’ la espera
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        let fullPrompt = `una imagen detallada y clara de ${prompt}, estilo ${style}, con resolución 4k, detalles nítidos y realistas, iluminación natural suave, sin marcas de agua, sin elementos distractivos o confusos, fondo limpio y minimalista que resalte el sujeto principal, con texturas bien definidas y colores vibrantes`;
        
        const imageBase64 = await generateImage(fullPrompt, style);
        const imageId = crypto.randomUUID(); // ID único pa’ rastrearla
        const embed = createEmbed('#FF1493', `¡Acá tenés, ${userName}!`, 
            `Tu imagen de "${prompt}" en estilo ${style} quedó zarpada. ID: ${imageId}. ¿Te copa?`, 
            `Hecho con onda por Oliver IA • ${new Date().toLocaleString()}`);
        await waitingMessage.edit({ embeds: [embed], files: [{ attachment: Buffer.from(imageBase64, 'base64'), name: `${imageId}.png` }] });
        generatedImages.set(imageId, { base64: imageBase64, prompt: fullPrompt, style }); // Guardo la imagen pa’ editarla después
    } catch (error) {
        console.error('Error generando imagen:', error.message);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No pude generar la imagen de "${prompt}", ${userName}. Error: ${error.message}. ¿Probamos más tarde o con otra cosa, loco?`, 
            `Hecho con onda por Oliver IA • ${new Date().toLocaleString()}`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

// Exporto la función pa’ usarla en otros lados
module.exports = { manejarImagen };

// Listo las imágenes que generé antes con !misimagenes
async function manejarMisImagenes(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';

    if (!dataStore.imageHistory || !dataStore.imageHistory[userName] || dataStore.imageHistory[userName].length === 0) {
        return sendError(message.channel, `¡No tenés imágenes guardadas, ${userName}!`, 
            'Generá una con !imagen primero, loco.');
    }

    const images = dataStore.imageHistory[userName];
    const imageList = images.slice(-5).map(img => 
        `ID: **${img.id}** - "${img.prompt}" (estilo ${img.style}) - ${new Date(img.timestamp).toLocaleString('es-AR')}`
    ).join('\n');

    const embed = createEmbed('#FFD700', `📸 Tus imágenes, ${userName}!`, 
        `Acá tenés tus últimas imágenes (máximo 5):\n\n${imageList}\n\nUsá !editarimagen [ID] [cambio] para modificar una, loco.`, 
        'Hecho con onda por Oliver IA'); // Dorado pa’ que brille
    await message.channel.send({ embeds: [embed] });
}

module.exports = { generateImage };

// Edito imágenes ya generadas con !editarimagen
async function manejarEditarImagen(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.startsWith('!editarimagen') ? message.content.slice(13).trim().split(' ') : message.content.slice(3).trim().split(' ');
    
    if (args.length < 2) {
        return sendError(message.channel, `¡Usá "!editarimagen [ID] [cambio]", ${userName}!`, 
            'Ejemplo: !editarimagen 1234 agregar un perro');
    }

    const imageId = args[0];
    const change = args.slice(1).join(' ').trim();

    if (!dataStore.imageHistory || !dataStore.imageHistory[userName]) {
        return sendError(message.channel, `¡No tenés imágenes para editar, ${userName}!`, 
            'Generá una con !imagen primero, loco.');
    }

    const image = dataStore.imageHistory[userName].find(img => img.id === imageId);
    if (!image) {
        return sendError(message.channel, `No encontré la imagen con ID ${imageId}, ${userName}.`, 
            'Fijate tus IDs con !misimagenes, loco.');
    }

    // Pido confirmación antes de editar, pa’ no meter la pata
    const confirmEmbed = createEmbed('#FF1493', `¡Pará un cacho, ${userName}!`, 
        `¿Querés editar la imagen "${image.prompt}" (ID: ${imageId}) para "${change}"? Reaccioná con ✅ o ❌, loco.`, 
        'Hecho con onda por Oliver IA'); // Naranja pa’ la alerta
    const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });
    await confirmMessage.react('✅');
    await confirmMessage.react('❌');

    const reactionFilter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
    let reactions;
    try {
        reactions = await confirmMessage.awaitReactions({ filter: reactionFilter, max: 1, time: 30000, errors: ['time'] });
    } catch {
        await sendError(message.channel, `⏳ ¡Te dormiste, ${userName}!`, 
            'No reaccionaste a tiempo, loco. ¿Probamos de nuevo?');
        return;
    }

    if (!reactions.size || reactions.first().emoji.name === '❌') {
        await sendSuccess(message.channel, '🛑 ¡Sin cambios!', `Tranqui, ${userName}, la imagen queda como está.`);
        return;
    }
  
    // Edito la imagen si me dan el OK
    const waitingEmbed = createEmbed('#FF1493', `⌛ Editando, ${userName}...`, 
        `Aguantá que modifico "${image.prompt}" con "${change}"...`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const newPrompt = `Una imagen copada de ${image.prompt}, modificada para ${change}, estilo ${image.style}, con onda argentina`;
        const newImageBase64 = await generateImage(newPrompt);
        const newImageAttachment = { attachment: Buffer.from(newImageBase64.split(',')[1], 'base64'), name: `imagen_editada_${userName}_${Date.now()}.png` };

        // Guardo la nueva versión en el historial
        const newImageId = uuidv4();
        dataStore.imageHistory[userName].push({
            id: newImageId,
            prompt: `${image.prompt}, modificada para ${change}`,
            style: image.style,
            base64: newImageBase64,
            timestamp: new Date().toISOString()
        });
        dataStoreModified = true;

        const embed = createEmbed('#FF1493', `¡Listo, ${userName}!`, 
            `Tu imagen editada: "${image.prompt}, ${change}" en estilo ${image.style}. Nuevo ID: ${newImageId}. ¿Te copa, loco?`);
        await waitingMessage.edit({ embeds: [embed], files: [newImageAttachment] });
    } catch (error) {
        console.error('Error editando imagen:', error.message);
        const errorEmbed = createEmbed('#FF1493', '¡Qué cagada!', 
            `No pude editar la imagen, ${userName}. Error: ${error.message}. ¿Probamos otra vez, loco?`);
        await waitingMessage.edit({ embeds: [errorEmbed] });
    }
}

module.exports = { manejarMisImagenes };
