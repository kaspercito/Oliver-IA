async function manejarReacciones(message) {
    // Acá arrancamos el juego de reacciones, pa’ ver qué tan rápido la pegás, loco
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    // Chequeo si tengo permisos pa’ mandar mensajes y embeds, si no, me voy al carajo
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

    // Armo una clave única pa’ este canal, así no se pisan las sesiones
    const reactionKey = `reaction_${message.channel.id}`;
    // Agarro la sesión actual si existe, pa’ ver si ya hay algo andando
    let session = dataStore.activeSessions[reactionKey];

    // Si hay una sesión activa y no está terminada, la corto y te doy el puntaje
    if (session && !session.completed) {
        // Marco la sesión como terminada, pa’ que no siga el loop
        session.completed = true;
        // Borro la sesión del dataStore, pa’ liberar espacio
        delete dataStore.activeSessions[reactionKey];
        // Marco que cambié algo en el dataStore, pa’ guardar después
        dataStoreModified = true;
        // Te aviso con verde que paré el juego y te muestro cuántos puntos hiciste
        await sendSuccess(message.channel, '🛑 ¡Reacciones paradas!', `Puntuación: ${session.score}, ${userName}.`);
        // Me voy, no sigo procesando más
        return;
    }

    // Si no hay sesión o la terminé, arranco una nueva desde cero
    session = { type: 'reaction', score: 0, currentRound: 0, completed: false, active: true };
    // Guardo la nueva sesión en el dataStore con la clave del canal
    dataStore.activeSessions[reactionKey] = session;
    // Marco que modifiqué el dataStore, pa’ que se guarde después
    dataStoreModified = true;

    // Arranco un loop zarpado pa’ las rondas, mientras no se termine o lo canceles
    while (!session.completed && session.active) {
        // Chequeo si la sesión sigue viva, si no, corto el loop
        if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

        // Saco una palabra random pa’ que la tipees
        const palabra = obtenerPalabraAleatoria();
        // Dorado pa’ la ronda, te tiro la palabra y tenés 30 segundos
        const embed = createEmbed('#FF1493', `🏁 Ronda ${session.currentRound + 1}`, 
            `Escribí: **${palabra}** en 30 segundos, ${userName}! (!rc para parar)`);
        // Mando el embed al canal
        await message.channel.send({ embeds: [embed] });

        try {
            // Espero tu respuesta, solo vos podés contestar, y nada de comandos de cancelar
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!rc', '!reacciones cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 30000,
                errors: ['time'],
            });

            // Doble chequeo post-respuesta, pa’ ver si no cancelaste mientras esperaba
            if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

            // Tomo lo que escribiste, todo en minúsculas pa’ no complicarla
            const respuesta = respuestas.first().content.toLowerCase();
            if (respuesta === palabra) {
                // La pegaste, sumás un punto y te lo festejo en verde
                session.score += 1;
                await sendSuccess(message.channel, '🎉 ¡Bien!', `La pegaste, ${userName}. Vas ${session.score}.`);
            } else {
                // Fallaste, loco, te lo marco en rojo y corto el juego
                session.completed = true;
                await sendError(message.channel, '❌ ¡Error!', `Fallaste, ${userName}. Era **${palabra}**.`);
            }
            // Subo la ronda y actualizo la sesión
            session.currentRound += 1;
            dataStore.activeSessions[reactionKey] = session;
            dataStoreModified = true;
        } catch {
            // Si se te acabó el tiempo, chequeo si seguís en el juego
            if (!dataStore.activeSessions[reactionKey] || !dataStore.activeSessions[reactionKey].active) break;

            // Tiempo agotado, te aviso en rojo y corto con el puntaje final
            session.completed = true;
            await sendError(message.channel, '⏳ ¡Tiempo!', `Se acabó, ${userName}. Puntuación: ${session.score}.`);
            delete dataStore.activeSessions[reactionKey];
            dataStoreModified = true;
        }
    }

    // Limpieza final, si terminé borro la sesión del dataStore
    if (dataStore.activeSessions[reactionKey] && session.completed) {
        delete dataStore.activeSessions[reactionKey];
        dataStoreModified = true;
    }
}

module.exports = { manejarReacciones };
