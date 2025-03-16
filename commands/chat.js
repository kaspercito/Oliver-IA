// Chat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Usamos Flash por velocidad

async function manejarChat(message) {
    // Acá Oliver se pone a charlar como amigo posta con Gemini, loco
    const userId = message.author.id;
    const userName = userId === OWNER_ID ? 'Miguel' : 'Belén';
    // Saco el mensaje, dependiendo si usaste !chat o !ch
    const chatMessage = message.content.startsWith('!chat') ? message.content.slice(5).trim() : message.content.slice(3).trim();

    // Si no escribiste nada, te pido algo en rojo
    if (!chatMessage) {
        return sendError(message.channel, `¡Escribí algo después de "!ch", ${userName}! No me dejes colgado, che.`, undefined, 'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
    }

    // Inicializo el historial si no existe
    if (!dataStore.conversationHistory) dataStore.conversationHistory = {};
    if (!dataStore.conversationHistory[userId]) dataStore.conversationHistory[userId] = [];

    // Agrego tu mensaje al historial con timestamp
    dataStore.conversationHistory[userId].push({ role: 'user', content: chatMessage, timestamp: Date.now() });
    // Limito a 20 mensajes pa’ no llenar la memoria
    if (dataStore.conversationHistory[userId].length > 20) {
        dataStore.conversationHistory[userId] = dataStore.conversationHistory[userId].slice(-20);
    }
    // Marco que cambié el dataStore
    dataStoreModified = true;

    // Armo el contexto con los últimos 20 mensajes
    const history = dataStore.conversationHistory[userId].slice(-20);
    const context = history.map(h => `${h.role === 'user' ? userName : 'Oliver'}: ${h.content}`).join('\n');
    
    // Te aviso en celeste que estoy pensando
    const waitingEmbed = createEmbed('#FF1493', `¡Aguantá un toque, ${userName}!`, 'Estoy pensando una respuesta re copada...', 'Hecho con onda por Miguel IA | Reacciona con ✅ o ❌');
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        // Le tiro el prompt a Gemini con onda argentina
        const prompt = `Sos Oliver IA, un bot re piola creado por Miguel. Hablá con onda argentina, usá "loco", "che", "posta". Esto es lo que charlamos antes:\n${context}\nRespondé a: "${chatMessage}" como amigo zarpado, con cariño si es para Belén, tipo "grosa" o "genia".`;
        
        // Genero la respuesta
        const result = await model.generateContent(prompt);
        let aiReply = result.response.text().trim();

        // Agrego la respuesta al historial
        dataStore.conversationHistory[userId].push({ role: 'assistant', content: aiReply, timestamp: Date.now() });
        if (dataStore.conversationHistory[userId].length > 20) {
            dataStore.conversationHistory[userId] = dataStore.conversationHistory[userId].slice(-20);
        }
        dataStoreModified = true;

        // Si la respuesta es muy larga, la corto pa’ Discord
        if (aiReply.length > 2000) aiReply = aiReply.slice(0, 1990) + '... (seguí charlando pa’ más, loco)';
        
        // Te mando la respuesta en celeste con reacciones pa’ que opines
        const finalEmbed = createEmbed('#FF1493', `¡Aquí estoy, ${userName}!`, `${aiReply}\n\n¿Te cerró, ${userName}? ¡Seguimos charlando, che!`, 'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
        const updatedMessage = await waitingMessage.edit({ embeds: [finalEmbed] });
        await updatedMessage.react('✅');
        await updatedMessage.react('❌');
        // Guardo el mensaje pa’ las reacciones después
        sentMessages.set(updatedMessage.id, { content: aiReply, originalQuestion: chatMessage, message: updatedMessage });
    } catch (error) {
        // Si Gemini falla, te aviso en rojo con un fallback
        console.error('Error con Gemini:', error.message);
        const fallbackReply = `¡Uy, ${userName}, qué cagada! Me mandé un moco, loco. ¿Me tirás otra vez el mensaje o seguimos con otra cosa?\n\n¿Te cerró, ${userName}? ¡Seguimos charlando, che!]`;
        const errorEmbed = createEmbed('#FF1493', `¡Qué cagada, ${userName}!`, fallbackReply, 'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
        const errorMessageSent = await waitingMessage.edit({ embeds: [errorEmbed] });
        await errorMessageSent.react('✅');
        await errorMessageSent.react('❌');
    }
}

module.exports = { manejarChat };
