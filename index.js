// Importa discord.js y dotenv
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config(); // Carga las variables de entorno

// Configura el cliente del bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Obtén el token desde la variable de entorno
const TOKEN = process.env.DISCORD_TOKEN;

// Evento cuando el bot está listo
client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// Comando para borrar todo
client.on('messageCreate', async (message) => {
  if (message.content === '!borrarTodo') {
    // Verifica que el usuario tenga permisos de administrador
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('No tienes permisos de administrador para ejecutar este comando.');
    }

    try {
      const guild = message.guild;

      // 1. Borrar todos los canales
      guild.channels.cache.forEach(async (channel) => {
        try {
          await channel.delete();
          console.log(`Canal ${channel.name} borrado.`);
        } catch (error) {
          console.error(`Error al borrar el canal ${channel.name}:`, error);
        }
      });

      // 2. Borrar todos los emojis
      guild.emojis.cache.forEach(async (emoji) => {
        try {
          await emoji.delete();
          console.log(`Emoji ${emoji.name} borrado.`);
        } catch (error) {
          console.error(`Error al borrar el emoji ${emoji.name}:`, error);
        }
      });

      // 3. Borrar todos los sonidos del panel de sonido
      const soundboardSounds = await guild.getSoundboardSounds();
      for (const sound of soundboardSounds) {
        try {
          await guild.deleteSoundboardSound(sound.sound_id);
          console.log(`Sonido ${sound.name} borrado.`);
        } catch (error) {
          console.error(`Error al borrar el sonido ${sound.name}:`, error);
        }
      }

      // Mensaje de confirmación
      await message.reply('Todos los canales, emojis y sonidos han sido borrados (o están en proceso).');
    } catch (error) {
      console.error('Error general:', error);
      await message.reply('Ocurrió un error al intentar borrar todo. Revisa la consola para más detalles.');
    }
  }
});

// Inicia el bot
client.login(TOKEN);
