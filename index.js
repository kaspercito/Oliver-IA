const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

// Configura el cliente del bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Obtén el token desde la variable de entorno
const TOKEN = process.env.DISCORD_TOKEN;

// Función para esperar un tiempo (en milisegundos)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Evento cuando el bot está listo
client.once('ready', async () => {
  console.log(`Bot conectado como ${client.user.tag} a las ${new Date().toLocaleString()}`);

  // Obtén el servidor (guild) donde el bot está
  // Cambia 'ID_DEL_SERVIDOR' por el ID del servidor donde quieres que se ejecute
  const guildId = '1134375138029211739'; // Reemplaza con el ID real del servidor
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    console.error(`No se encontró el servidor con ID ${guildId}. Asegúrate de que el bot esté en el servidor y el ID sea correcto.`);
    return;
  }

  // Verifica si el bot tiene permisos de administrador
  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
    console.error('El bot no tiene permisos de administrador en el servidor.');
    return;
  }

  try {
    // 1. Borrar todos los canales
    console.log('Iniciando eliminación de canales...');
    for (const channel of guild.channels.cache.values()) {
      try {
        await channel.delete();
        console.log(`Canal ${channel.name} borrado.`);
        await delay(1000); // Espera 1 segundo para evitar límites de la API
      } catch (error) {
        console.error(`Error al borrar el canal ${channel.name}: ${error.message}`);
      }
    }

    // 2. Borrar todos los emojis
    console.log('Iniciando eliminación de emojis...');
    for (const emoji of guild.emojis.cache.values()) {
      try {
        await emoji.delete();
        console.log(`Emoji ${emoji.name} borrado.`);
        await delay(1000); // Espera 1 segundo
      } catch (error) {
        console.error(`Error al borrar el emoji ${emoji.name}: ${error.message}`);
      }
    }

    // 3. Borrar todos los sonidos del panel de sonido
    console.log('Iniciando eliminación de sonidos del panel de sonido...');
    try {
      const soundboardSounds = await guild.getSoundboardSounds();
      for (const sound of soundboardSounds) {
        try {
          await guild.deleteSoundboardSound(sound.sound_id);
          console.log(`Sonido ${sound.name} borrado.`);
          await delay(1000); // Espera 1 segundo
        } catch (error) {
          console.error(`Error al borrar el sonido ${sound.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error al obtener o borrar sonidos del panel de sonido:', error.message);
    }

    console.log('Eliminación completada.');
  } catch (error) {
    console.error('Error general durante la eliminación:', error.message);
  }

  // Opcional: Cierra el bot después de completar la tarea
  console.log('Tarea finalizada. Cerrando el bot...');
  client.destroy();
});

// Inicia el bot
client.login(TOKEN).catch((error) => {
  console.error('Error al iniciar el bot:', error.message);
});
