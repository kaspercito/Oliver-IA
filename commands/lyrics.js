// Función pa’ traerte las letras de una canción
async function manejarLyrics(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
    if (!message.guild) return sendError(message.channel, `Este comando solo funciona en servidores, ${userName}.`);

    const args = message.content.split(' ').slice(1).join(' ').trim();
    const player = manager.players.get(message.guild.id);
    let songTitle;

    if (!args) {
        if (!player || !player.queue.current) {
            return sendError(message.channel, `No hay ninguna canción sonando ahora, ${userName}. Usa !lyrics [nombre de la canción] para buscar una específica.`);
        }
        songTitle = player.queue.current.title;
    } else {
        songTitle = args;
    }

    // Limpieza más agresiva del título
    songTitle = songTitle
        .replace(/\s*\(official music video\)/i, '')
        .replace(/\s*\(videoclip oficial\)/i, '')
        .replace(/\s*-\s*/g, ' ')
        .replace(/\s*\[.*?\]/g, '') // Sacamos cualquier cosa entre corchetes
        .trim();

    console.log(`Buscando letras para: "${songTitle}"`);

    const waitingEmbed = createEmbed('#55FFFF', `⌛ Buscando letras, ${userName}...`, `Espera un momento mientras busco las letras de "${songTitle}".`);
    const waitingMessage = await message.channel.send({ embeds: [waitingEmbed] });

    try {
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(songTitle)}`;
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` }
        });

        const hits = searchResponse.data.response.hits;
        if (!hits || hits.length === 0) {
            throw new Error('No se encontraron resultados en Genius.');
        }

        const songId = hits[0].result.id;
        const songTitleFound = hits[0].result.full_title; // Debug: qué canción encontró
        console.log(`Canción encontrada en Genius: "${songTitleFound}" (ID: ${songId})`);

        const songUrl = `https://api.genius.com/songs/${songId}`;
        const songResponse = await axios.get(songUrl, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` }
        });

        const lyricsPath = songResponse.data.response.song.path;
        const lyricsPageUrl = `https://genius.com${lyricsPath}`;
        console.log(`Scrapeando letras desde: ${lyricsPageUrl}`);

        const lyricsPage = await axios.get(lyricsPageUrl);
        const $ = cheerio.load(lyricsPage.data);

        let lyrics = '';
        $('div[class*="Lyrics__Container"]').each((i, elem) => {
            lyrics += $(elem).text() + '\n';
        });

        lyrics = lyrics.trim();
        if (!lyrics) {
            throw new Error('No se encontraron letras en la página.');
        }

        console.log(`Letras encontradas (primeros 100 caracteres): "${lyrics.substring(0, 100)}..."`);

        const maxLength = 2000;
        if (lyrics.length <= maxLength) {
            const embed = createEmbed('#FFD700', `🎵 Letras de "${songTitle}"`, lyrics);
            await waitingMessage.edit({ embeds: [embed] });
        } else {
            const chunks = [];
            for (let i = 0; i < lyrics.length; i += maxLength) {
                chunks.push(lyrics.substring(i, i + maxLength));
            }
            const firstEmbed = createEmbed('#FFD700', `🎵 Letras de "${songTitle}" (Parte 1/${chunks.length})`, chunks[0]);
            await waitingMessage.edit({ embeds: [firstEmbed] });
            for (let i = 1; i < chunks.length; i++) {
                const embed = createEmbed('#FFD700', `🎵 Letras de "${songTitle}" (Parte ${i + 1}/${chunks.length})`, chunks[i]);
                await message.channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(`Error al buscar letras para "${songTitle}": ${error.message}`);
        await waitingMessage.edit({ embeds: [createEmbed('#FF5555', '¡Ups!', `No pude encontrar las letras de "${songTitle}", ${userName}. Error: ${error.message}`)] });
    }
}

module.exports = { manejarLyrics };
