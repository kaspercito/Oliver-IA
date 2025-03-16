function parsearTiempo(texto) {
    const ahora = new Date();
    let fechaObjetivo = new Date(ahora);

    // Expresiones regulares pa’ capturar el tiempo
    const enMinutos = texto.match(/en (\d+) minuto(s)?/i);
    const enHoras = texto.match(/en (\d+) hora(s)?/i);
    const enDias = texto.match(/en (\d+) día(s)?/i);
    const mañana = texto.match(/mañana (?:a las )?(\d{1,2}):(\d{2})/i);
    const fechaEspecifica = texto.match(/(\d{1,2})\/(\d{1,2})(?: a las (\d{1,2}):(\d{2}))?/i);

    if (enMinutos) {
        fechaObjetivo.setMinutes(ahora.getMinutes() + parseInt(enMinutos[1]));
    } else if (enHoras) {
        fechaObjetivo.setHours(ahora.getHours() + parseInt(enHoras[1]));
    } else if (enDias) {
        fechaObjetivo.setDate(ahora.getDate() + parseInt(enDias[1]));
    } else if (mañana) {
        fechaObjetivo.setDate(ahora.getDate() + 1);
        fechaObjetivo.setHours(parseInt(mañana[1]), parseInt(mañana[2]), 0, 0);
    } else if (fechaEspecifica) {
        const dia = parseInt(fechaEspecifica[1]);
        const mes = parseInt(fechaEspecifica[2]) - 1; // Meses en JS son 0-11
        const hora = fechaEspecifica[3] ? parseInt(fechaEspecifica[3]) : 0;
        const minutos = fechaEspecifica[4] ? parseInt(fechaEspecifica[4]) : 0;
        fechaObjetivo = new Date(ahora.getFullYear(), mes, dia, hora, minutos);
    } else {
        return null; // Si no entiende, devolvemos null
    }

    return fechaObjetivo.getTime() > ahora.getTime() ? fechaObjetivo : null; // Solo futuro
}

async function manejarRecordatorio(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    const args = message.content.split(' ').slice(1).join(' ').trim();

    if (!args) return sendError(message.channel, `¡Mandame algo pa’ recordar, ${userName}! Ejemplo: "!rec comprar sanduche de miga en 1 hora".`);

    const palabras = args.split(' ');
    let tiempoIndex = -1;

    for (let i = 0; i < palabras.length; i++) {
        if (
            palabras[i].toLowerCase() === 'en' ||
            palabras[i].toLowerCase() === 'mañana' ||
            palabras[i].match(/\d{1,2}\/\d{1,2}/)
        ) {
            tiempoIndex = i;
            break;
        }
    }

    if (tiempoIndex === -1) return sendError(message.channel, `No entendí el tiempo, ${userName}. Usá "en 5 minutos", "mañana 15:00" o "20/03 14:30".`);

    const mensaje = palabras.slice(0, tiempoIndex).join(' ').trim();
    const tiempoTexto = palabras.slice(tiempoIndex).join(' ').trim();

    if (!mensaje) return sendError(message.channel, `¡Decime qué recordar, ${userName}! Ejemplo: "!rec comprar sanguche de miga en 1 hora".`);

    const fechaObjetivo = parsearTiempo(tiempoTexto);
    if (!fechaObjetivo) return sendError(message.channel, `No entendí el tiempo, ${userName}. Usá "en 5 minutos", "en 1 hora", "mañana 15:00" o "20/03 14:30".`);

    // Guardamos el recordatorio en memoria
    dataStore.recordatorios = dataStore.recordatorios || [];
    const id = uuidv4();
    const recordatorio = {
        id,
        userId: message.author.id,
        channelId: message.channel.id,
        mensaje,
        timestamp: fechaObjetivo.getTime(),
        creado: new Date().getTime()
    };
    dataStore.recordatorios.push(recordatorio);
    dataStoreModified = true;

    const diferencia = fechaObjetivo.getTime() - Date.now();
    const fechaStr = fechaObjetivo.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    console.log(`Recordatorio seteado: "${mensaje}" para ${userName} (ID: ${id}) el ${fechaStr}`);

    // Chequeamos si hay música activa
    const musicActive = manager.players.size > 0;
    let guardadoMsg = '';

    if (musicActive) {
        guardadoMsg = `\n⚠️ Hay música sonando, así que no guardo ahora pa’ no cortar el vibe. Se guarda en 30 min (autosave) o cuando pare la música. Si reinicio antes, se pierde, loco.`;
    } else {
        try {
            await saveDataStore();
            console.log(`Datos guardados en GitHub tras setear recordatorio para ${userName}`);
            dataStoreModified = false; // Reseteamos el flag después de guardar
            guardadoMsg = `\n💾 Guardado en GitHub al toque, ¡tranqui!`;
        } catch (error) {
            console.error(`Error al guardar recordatorio en GitHub: ${error.message}`);
            guardadoMsg = `\n⚠️ No pude guardar en GitHub, ${userName}. Error: ${error.message}. Se pierde si reinicio antes del autosave.`;
        }
    }

    // Confirmación en el canal original
    await sendSuccess(message.channel, '⏰ ¡Recordatorio seteado!', 
        `Te aviso "${mensaje}" el ${fechaStr} por DM, ${userName}. ¡No te duermas, loco!${guardadoMsg}`);

    // Programar el recordatorio
    programarRecordatorio(recordatorio);
}

module.exports = { manejarRecordatorio };

// Nueva función para programar recordatorios
function programarRecordatorio(recordatorio) {
    const diferencia = recordatorio.timestamp - Date.now();
    const userName = recordatorio.userId === OWNER_ID ? 'Miguel' : 'Belén';

    if (diferencia <= 0) {
        console.log(`Recordatorio "${recordatorio.mensaje}" (ID: ${recordatorio.id}) ya venció, no se programa.`);
        dataStore.recordatorios = dataStore.recordatorios.filter(r => r.id !== recordatorio.id);
        dataStoreModified = true;
        return;
    }

    console.log(`Programando recordatorio "${recordatorio.mensaje}" (ID: ${recordatorio.id}) en ${diferencia / 1000} segundos.`);

    setTimeout(async () => {
        try {
            const usuario = await client.users.fetch(recordatorio.userId);
            if (usuario) {
                await usuario.send({ embeds: [createEmbed('#FF1493', '⏰ ¡Recordatorio, loco!', 
                    `<@${recordatorio.userId}>, acordate de: **${recordatorio.mensaje}**. ¡Ya es hora, ${userName}!`)] });
                console.log(`Recordatorio enviado a ${userName}: "${recordatorio.mensaje}" (ID: ${recordatorio.id})`);
            }
        } catch (error) {
            console.error(`No pude enviar DM al usuario ${recordatorio.userId}: ${error.message}`);
        }
        // Limpiar el recordatorio de la lista
        dataStore.recordatorios = dataStore.recordatorios.filter(r => r.id !== recordatorio.id);
        dataStoreModified = true;
    }, diferencia);
}

module.exports = { programarRecordatorio };
