// Saco una pregunta de trivia sin opciones, con un log pa’ ver qué pasa
function obtenerPreguntaTriviaSinOpciones(usedQuestions, categoria) {
    console.log("Obteniendo pregunta para categoría:", categoria, "Preguntas usadas:", usedQuestions.length);
    const preguntasCategoria = preguntasTriviaSinOpciones[categoria] || []; // Si no hay categoría, chau
    const available = preguntasCategoria.filter(q => !usedQuestions.includes(q.pregunta)); // Filtro las que no usé
    console.log("Preguntas disponibles:", available.length);
    if (available.length === 0) return null; // Si no quedan, me rindo
    return available[Math.floor(Math.random() * available.length)]; // Elijo una random, joya
}

// Trivia copada, la hice pa’ que Miguel y Belén se diviertan
async function manejarTrivia(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return; // Si no puedo mandar embeds, me voy

    const args = normalizeText(message.content).split(' ').slice(1); // Saco el comando y normalizo
    const categoria = args[0] in preguntasTriviaSinOpciones ? args[0] : 'capitales'; // Por default, capitales
    const numQuestions = Math.max(parseInt(args[1]) || 20, 20); // Mínimo 20 preguntas, loco

    const triviaKey = `trivia_${message.channel.id}`;
    if (dataStore.activeSessions[triviaKey]) {
        await sendError(message.channel, `Ya hay una trivia activa en este canal, ${userName}.`, 'Cancelala con !tc primero.');
        return; // No quiero dos trivias juntas, qué quilombo
    }

    let session = {
        type: 'trivia',
        currentQuestion: 0,
        score: 0,
        totalQuestions: numQuestions,
        usedQuestions: [],
        categoria,
        active: true,
    };
    dataStore.activeSessions[triviaKey] = session; // Guardo la sesión pa’ no perderla
    dataStoreModified = true; // Marco que cambié algo

    while (session.currentQuestion < session.totalQuestions && session.active) {
        if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break; // Si se canceló, chau

        const available = preguntasTriviaSinOpciones[categoria].filter(q => !session.usedQuestions.includes(q.pregunta));
        if (!available.length) {
            await sendSuccess(message.channel, '🏁 ¡Se acabaron las preguntas!', `No hay más en ${categoria}, ${userName}.`);
            break; // Si no hay más preguntas, terminé
        }

        const trivia = available[Math.floor(Math.random() * available.length)];
        session.usedQuestions.push(trivia.pregunta); // Marco esta como usada
        const embed = createEmbed('#55FFFF', `🎲 Pregunta ${session.currentQuestion + 1}/${numQuestions} (${categoria})`,
            `${trivia.pregunta}\n\n¡Responde en 60 segundos, ${userName}! O cancelá con !tc.`); // Celeste pa’ la trivia
        const sent = await message.channel.send({ embeds: [embed] });

        activeTrivia.set(message.channel.id, { id: sent.id, correcta: trivia.respuesta, userId: message.author.id });
        dataStoreModified = true;

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!tc', '!trivia cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 60000,
                errors: ['time'],
            });
            const respuesta = cleanText(respuestas.first().content);
            activeTrivia.delete(message.channel.id);

            if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break;

            if (!dataStore.triviaStats[message.author.id]) dataStore.triviaStats[message.author.id] = {};
            if (!dataStore.triviaStats[message.author.id][categoria]) dataStore.triviaStats[message.author.id][categoria] = { correct: 0, total: 0 };
            dataStore.triviaStats[message.author.id][categoria].total += 1;

            if (respuesta === cleanText(trivia.respuesta)) {
                session.score += 1;
                dataStore.triviaStats[message.author.id][categoria].correct += 1;
                await sendSuccess(message.channel, '🎉 ¡Acierto!', `¡Grande, ${userName}! Era **${trivia.respuesta}**. Vas ${session.score}.`); // Verde pa’ festejar
            } else {
                await sendError(message.channel, '❌ ¡Fallaste!', `La posta era **${trivia.respuesta}**, ${userName}. Dijiste "${respuesta}".`); // Rojo pa’ la cagada
            }
            session.currentQuestion += 1;
            dataStore.activeSessions[triviaKey] = session;
            dataStoreModified = true;
        } catch {
            activeTrivia.delete(message.channel.id);
            if (!dataStore.activeSessions[triviaKey] || !dataStore.activeSessions[triviaKey].active) break;
            await sendError(message.channel, '⏳ ¡Tiempo!', `Se acabó, ${userName}. Era **${trivia.respuesta}**.`);
            session.currentQuestion += 1;
            dataStore.activeSessions[triviaKey] = session;
            dataStoreModified = true;
        }
    }

    if (session.currentQuestion >= session.totalQuestions && dataStore.activeSessions[triviaKey]) {
        await sendSuccess(message.channel, '🏁 ¡Trivia terminada!', `Puntuación: ${session.score}/${numQuestions}, ${userName}.`);
        if (!dataStore.triviaRanking[message.author.id]) dataStore.triviaRanking[message.author.id] = {};
        dataStore.triviaRanking[message.author.id][categoria] = dataStore.triviaStats[message.author.id][categoria].correct;
        delete dataStore.activeSessions[triviaKey];
        activeTrivia.delete(message.channel.id);
        dataStoreModified = true;
    }
}

module.exports = { manejarTrivia };
