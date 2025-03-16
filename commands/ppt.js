function determinarGanador(jugador1, jugador2) {
    if (jugador1 === jugador2) return 'empate';
    if (
        (jugador1 === 'piedra' && jugador2 === 'tijera') ||
        (jugador1 === 'papel' && jugador2 === 'piedra') ||
        (jugador1 === 'tijera' && jugador2 === 'papel')
    ) return 'jugador1';
    return 'jugador2';
}

// Elección random del bot
function eleccionBot() {
    return opcionesPPT[Math.floor(Math.random() * opcionesPPT.length)];
}

async function manejarPPTBot(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.slice(4).trim().toLowerCase();

    if (!args || !opcionesPPT.includes(args)) {
        return sendError(message.channel, `¡Escribí bien, ${userName}! Usá "!ppt piedra", "!ppt papel" o "!ppt tijera", loco.`);
    }

    const eleccionUsuario = args;
    const eleccionIA = eleccionBot();
    const resultado = determinarGanador(eleccionUsuario, eleccionIA);

    let mensajeResultado;
    if (resultado === 'empate') {
        mensajeResultado = `¡Empate, ${userName}! Los dos sacamos **${eleccionUsuario}**. ¿Otra ronda, loco?`;
    } else if (resultado === 'jugador1') {
        mensajeResultado = `¡Ganaste, ${userName}! Tu **${eleccionUsuario}** le ganó a mi **${eleccionIA}**. ¡Sos un crack, che!`;
    } else {
        mensajeResultado = `¡Te gané, ${userName}! Mi **${eleccionIA}** le rompió el orto a tu **${eleccionUsuario}**. ¡Ja, boludo, otra pa’ la revancha!`;
    }

    const embed = createEmbed('#FF1493', `¡Piedra, Papel o Tijera con ${userName}!`, mensajeResultado);
    await message.channel.send({ embeds: [embed] });
}

module.exports = { manejarPPTBot };

// Jugar contra otra persona
async function manejarPPTPersona(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.slice(4).trim();
    const mentionedUser = message.mentions.users.first();

    if (!mentionedUser) {
        return sendError(message.channel, `¡Mencioná a alguien, ${userName}! Usá "!ppt @alguien", loco.`);
    }
    if (mentionedUser.id === message.author.id) {
        return sendError(message.channel, `¡No podés jugar contra vos mismo, ${userName}! Mencioná a otro, dale.`);
    }
    if (mentionedUser.bot) {
        return sendError(message.channel, `¡No juego con bots, ${userName}! Elegí a un humano, che.`);
    }

    const desafiadoName = mentionedUser.id === OWNER_ID ? 'Miguel' : 'Belén';
    const pptKey = `ppt_${message.author.id}_${mentionedUser.id}`;

    if (dataStore.activeSessions[pptKey]) {
        return sendError(message.channel, `Ya hay un desafío activo entre vos y ${desafiadoName}, ${userName}. ¡Terminá ese primero, loco!`);
    }

    // Crear sesión
    dataStore.activeSessions[pptKey] = {
        type: 'ppt_persona',
        challenger: message.author.id,
        challenged: mentionedUser.id,
        challengerChoice: null,
        challengedChoice: null,
        accepted: false,
        active: true
    };
    dataStoreModified = true;

    // Enviar desafío
    const desafioEmbed = createEmbed('#FF1493', `¡Desafío de ${userName}!`, 
        `${userName} te desafió a Piedra, Papel o Tijera, ${desafiadoName}. Reaccioná con ✅ pa’ aceptar o ❌ pa’ rechazar, loco. Tenés 30 segundos.`);
    const desafioMessage = await message.channel.send({ embeds: [desafioEmbed], content: `<@${mentionedUser.id}>` });
    await desafioMessage.react('✅');
    await desafioMessage.react('❌');

    const reactionFilter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === mentionedUser.id;
    try {
        const reactions = await desafioMessage.awaitReactions({ filter: reactionFilter, max: 1, time: 30000, errors: ['time'] });
        if (reactions.first().emoji.name === '❌') {
            delete dataStore.activeSessions[pptKey];
            dataStoreModified = true;
            return sendSuccess(message.channel, '🛑 ¡Desafío rechazado!', `${desafiadoName} dijo que no, ${userName}. ¡Buscate otro rival, loco!`);
        }

        // Aceptado
        dataStore.activeSessions[pptKey].accepted = true;
        dataStoreModified = true;
        await sendSuccess(message.channel, '✅ ¡Desafío aceptado!', `${desafiadoName} dijo que sí, ${userName}. ¡A elegir en privado, locos!`);

        // Pedir elecciones por MD
        const instrucciones = `Mandame tu elección ("piedra", "papel" o "tijera") por acá, loco. ¡No hagas trampa, eh!`;
        await message.author.send({ embeds: [createEmbed('#FF1493', '¡Tu turno!', instrucciones)] });
        await mentionedUser.send({ embeds: [createEmbed('#FF1493', '¡Tu turno!', instrucciones)] });

        // Escuchar elecciones en MD
        const dmFilter = m => opcionesPPT.includes(m.content.toLowerCase());
        const challengerCollector = message.author.dmChannel.createMessageCollector({ filter: dmFilter, max: 1, time: 60000 });
        const challengedCollector = mentionedUser.dmChannel.createMessageCollector({ filter: dmFilter, max: 1, time: 60000 });

        challengerCollector.on('collect', m => {
            dataStore.activeSessions[pptKey].challengerChoice = m.content.toLowerCase();
            dataStoreModified = true;
            m.reply({ embeds: [createEmbed('#FF1493', '✅ ¡Elección guardada!', `Elegiste **${m.content}**, ${userName}. Esperando a ${desafiadoName}, loco.`)] });
        });

        challengedCollector.on('collect', m => {
            dataStore.activeSessions[pptKey].challengedChoice = m.content.toLowerCase();
            dataStoreModified = true;
            m.reply({ embeds: [createEmbed('#FF1493', '✅ ¡Elección guardada!', `Elegiste **${m.content}**, ${desafiadoName}. Esperando a ${userName}, loco.`)] });
        });

        Promise.all([challengerCollector, challengedCollector].map(c => new Promise(resolve => c.on('end', resolve)))).then(async () => {
            const session = dataStore.activeSessions[pptKey];
            if (!session || !session.challengerChoice || !session.challengedChoice) {
                delete dataStore.activeSessions[pptKey];
                dataStoreModified = true;
                return sendError(message.channel, '⏳ ¡Se acabó el tiempo!', `Uno de los dos no eligió a tiempo, ${userName}. ¡Otra vez será, loco!`);
            }

            const resultado = determinarGanador(session.challengerChoice, session.challengedChoice);
            let mensajeResultado;
            if (resultado === 'empate') {
                mensajeResultado = `¡Empate, locos! ${userName} sacó **${session.challengerChoice}** y ${desafiadoName} sacó **${session.challengedChoice}**. ¿Revancha?`;
            } else if (resultado === 'jugador1') {
                mensajeResultado = `¡Ganó ${userName}! **${session.challengerChoice}** le ganó a **${session.challengedChoice}** de ${desafiadoName}. ¡Grande, loco!`;
            } else {
                mensajeResultado = `¡Ganó ${desafiadoName}! **${session.challengedChoice}** le ganó a **${session.challengerChoice}** de ${userName}. ¡La rompió, che!`;
            }

            const resultadoEmbed = createEmbed('#FF1493', '🏆 ¡Resultado del duelo!', mensajeResultado);
            await message.channel.send({ embeds: [resultadoEmbed] });
            delete dataStore.activeSessions[pptKey];
            dataStoreModified = true;
        });

    } catch {
        delete dataStore.activeSessions[pptKey];
        dataStoreModified = true;
        await sendError(message.channel, '⏳ ¡Tiempo agotado!', `${desafiadoName} no respondió, ${userName}. ¡Buscate otro rival, loco!`);
    }
}

module.exports = { manejarPPTPersona };
