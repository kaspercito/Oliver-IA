// Saco una frase pa’l juego de mecanografía
function obtenerFrasePPM() {
    return frasesPPM[Math.floor(Math.random() * frasesPPM.length)]; // Random posta
}

// Juego de PPM, pa’ ver quién tipea más rápido
async function manejarPPM(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

    const ppmKey = `ppm_${message.author.id}`;
    let session = dataStore.activeSessions[ppmKey];

    if (session && !session.completed) {
        await sendError(message.channel, `Ya tenés un PPM activo, ${userName}.`, 'Termina el actual o cancelalo con !pc.');
        return; // No quiero dos juegos a la vez
    }

    const countdownEmbed = createEmbed('#FFAA00', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en 3...`); // Naranja pa’ la cuenta
    const countdownMessage = await message.channel.send({ embeds: [countdownEmbed] });

    for (let i = 2; i >= 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedEmbed = createEmbed('#FF1493', '⏳ Cuenta Regresiva', `¡Prepárate, ${userName}! Empieza en ${i}...`);
        await countdownMessage.edit({ embeds: [updatedEmbed] });
    }

    const goEmbed = createEmbed('#FF1493', '🚀 ¡Ya!', `¡Adelante, ${userName}!`); // Verde brillante pa’ arrancar
    await countdownMessage.edit({ embeds: [goEmbed] });

    let intentoCorrecto = false;
    session = { type: 'ppm', frase: null, startTime: null, completed: false, active: true };
    dataStore.activeSessions[ppmKey] = session;
    dataStoreModified = true;

    while (!intentoCorrecto && session.active) {
        if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;

        const frase = obtenerFrasePPM();
        const startTime = Date.now();
        const embed = createEmbed('#FF1493', '📝 Prueba de Mecanografía',
            `Escribí esta frase lo más rápido que puedas:\n\n**${frase}**\n\nTenés 15 segundos, ${userName}. (!pc para cancelar)`); // Celeste pa’l juego
        await message.channel.send({ embeds: [embed] });

        session.frase = frase;
        session.startTime = startTime;
        dataStore.activeSessions[ppmKey] = session;
        dataStoreModified = true;

        try {
            const respuestas = await message.channel.awaitMessages({
                filter: (res) => res.author.id === message.author.id && !['!pc', '!ppm cancelar'].includes(res.content.toLowerCase()),
                max: 1,
                time: 15000,
                errors: ['time'],
            });
            const respuestaUsuario = cleanText(respuestas.first().content);
            const endTime = Date.now();

            if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;

            session.completed = true;
            delete dataStore.activeSessions[ppmKey];
            dataStoreModified = true;

            const tiempoSegundos = (endTime - startTime) / 1000;
            const palabras = frase.split(' ').length;
            const ppm = Math.round((palabras / tiempoSegundos) * 60);

            if (respuestaUsuario === cleanText(frase)) {
                intentoCorrecto = true;
                if (!dataStore.personalPPMRecords[message.author.id]) {
                    dataStore.personalPPMRecords[message.author.id] = { best: { ppm: 0, timestamp: null }, attempts: [] };
                }

                dataStore.personalPPMRecords[message.author.id].attempts.push({ ppm, timestamp: new Date().toISOString() });
                dataStoreModified = true;

                const currentBest = dataStore.personalPPMRecords[message.author.id].best.ppm || 0;
                if (ppm > currentBest) {
                    dataStore.personalPPMRecords[message.author.id].best = { ppm, timestamp: new Date().toISOString() };
                    dataStoreModified = true;
                    await sendSuccess(message.channel, '🎉 ¡Récord nuevo, crack!',
                        `¡Sos un animal, ${userName}! Tipeaste la frase en ${tiempoSegundos.toFixed(2)} segundos.\nTu nuevo récord: **${ppm} PPM**. Mirá tus intentos con !rppm.`); // Verde pa’l festejo
                } else {
                    await sendSuccess(message.channel, '🎉 ¡Copado, che!',
                        `¡Bien ahí, ${userName}! La frase te salió en ${tiempoSegundos.toFixed(2)} segundos.\nTu PPM: **${ppm}**. Tu récord sigue en **${currentBest} PPM**. Fijate todo con !rppm.`); // Verde también
                }
            } else {
                await sendError(message.channel, '� ❌ ¡Casi la pegás!',
                    `¡Uy, ${userName}, te mandaste una cagada! Tu respuesta fue "${respuestaUsuario}". La posta era **${frase}**. ¡Probá de nuevo, dale!`); // Rojo pa’l fail
            }
        } catch {
            if (!dataStore.activeSessions[ppmKey] || !dataStore.activeSessions[ppmKey].active) break;
            await sendError(message.channel, '⏳ ¡Te dormiste, boludo!',
                `Se te fue el tiempo, ${userName}. La frase era: **${frase}**. ¡Otra chance ahora!`); // Rojo pa’l tiempo
        }
    }
}

module.exports = { manejarPPM };
