// Tips pa’ la ansiedad con !ansiedad, con un mensaje especial pa’ vos
async function manejarAnsiedad(message) {
    const userName = message.author.id === OWNER_ID ? 'Miguel' : 'Belén';
const tips = [
    "Tomá aire profundo, loco: inhalá contando 4, aguantá 4, soltá en 4. Repetilo tres veces y vas a ver cómo afloja.",
    "Movete un toque, genia: caminá, estirá las patas o bailá algo rápido. ¡Saca esa energía loca!",
    "Tirate a escuchar un tema que te vuele la cabeza, grosa. Música pa’ desconectar.",
    "Pensá en algo copado que hiciste esta semana, che. ¡Vos podés con todo!",
    "Tomate un mate tranqui, genia, y dejá que el calor te relaje el alma, ¡posta!",
    "Escribí todo lo que te preocupa en un papel y después rompelo, loco. ¡Sacate ese peso de encima!",
    "Hacé una lista corta de 3 cosas que te hagan sonreír, grosa. ¡Eso te sube el ánimo al toque!",
    "Mirá un video de gatitos o perritos, che. Esos bichos siempre te sacan una sonrisa, ¡seguro!",
    "Cerrá los ojos y visualizá un lugar re tranqui, como una playa o el campo, genia. ¡Mentalmente viajá ahí un rato!",
    "Estirá el cuerpo como si fueras un gato: brazos pa’ arriba, espalda arqueada. ¡Soltá toda la tensión, loco!",
    "Tomá un vaso de agua fresca bien despacito, grosa. Sentí cómo te refresca y te calma.",
    "Contá al revés desde 10, bien tranqui, che. Eso te ayuda a bajar un cambio, ¡posta!",
    "Ponete a ordenar algo chiquito, como tu escritorio, genia. ¡Eso te da sensación de control y calma!",
    "Mandale un mensaje a alguien que te banque siempre, loco. Charlar un toque te va a hacer bien.",
    "Hacé un mini baile de 30 segundos con tu tema favorito, grosa. ¡A mover el esqueleto y sacar la ansiedad!",
    "Buscá un chiste rápido en el celu y reíte un rato, che. La risa es lo mejor pa’ cortar el estrés.",
    "Acariciá algo suave, como una manta o una remera vieja, genia. ¡Eso te da una calma zarpada!",
    "Imaginá que estás soplando una burbuja gigante y bien lenta, loco. Eso te ayuda a respirar mejor.",
    "Hacete un té o una infusión calentita y tomate un break, grosa. ¡Es como un abrazo en taza!",
    "Salí un toque al balcón o al patio y mirá el cielo, che. El aire fresco te renueva las pilas.",
    "Ponete a dibujar garabatos en una hoja, genia. No hace falta que sea arte, solo dejá que fluya.",
    "Hacé una mini meditación: cerrá los ojos, poné una mano en la panza y respirá hondo 5 veces, loco.",
    "Buscá un meme que te saque una carcajada, grosa. ¡La risa es la mejor medicina, posta!",
    "Contá 5 cosas que ves, 4 que podés tocar, 3 que escuchás, 2 que olés y 1 que saboreás, che. ¡Eso te trae al presente!",
    "Hacé una pausa y mirá por la ventana un rato, genia. Dejá que la mente se despeje sola.",
    "Cantá una canción que te sepas de memoria bien fuerte, loco. ¡A sacar todo lo que tenés adentro!",
    "Tomá un caramelo o un chicle y concentrate en el sabor, grosa. Eso te distrae un toque.",
    "Hacete una lista mental de 3 cosas por las que estás agradecida hoy, che. ¡Eso te sube el ánimo al toque!",
    "Jugá un rato con algo chiquito, como apretar una pelotita antiestrés, genia. ¡Eso te relaja las manos y la cabeza!",
    "Escribí 3 cosas que te salieron bien en el día, loco. ¡Recordá que sos una grosa, siempre!",
    "Mirá una foto de un momento feliz y recordá cómo te sentiste, grosa. ¡Eso te da pilas pa’ seguir!",
    "Hacé un estiramiento de cuello: girá la cabeza despacito pa’ los dos lados, che. ¡Soltá esa tensión acumulada!"
];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    const mensajeMiguel = "¡Ojo al dato, Belén! Miguel te manda un abrazo zarpado y te desea toda la suerte del mundo pa’ ese examen. Confiá en vos, genia, que sos una grosa y la vas a romper, ¡posta!";

    const embed = createEmbed('#FF1493', `¡Tranqui, ${userName}!`, 
        `${tip}\n\n${mensajeMiguel}\n\n¿Querés charlar más o te tiro otro tip al toque?`, 
        'Con cariño, Oliver IA | Reacciona con ✅ o ❌');
    const sentMessage = await message.channel.send({ embeds: [embed] });
    await sentMessage.react('✅');
    await sentMessage.react('❌');
    sentMessages.set(sentMessage.id, { content: `${tip} ${mensajeMiguel}`, message: sentMessage });
}

module.exports = { manejarAnsiedad };
