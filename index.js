import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const BELEN_USER_ID = process.env.BELEN_USER_ID; // ID de Belén desde el .env
const CHANNEL_ID = process.env.CHANNEL_ID; // Agrega el ID del canal en tu archivo .env

async function sendFinalMessageAndShutdown() {
  const finalMessage = `
<@${BELEN_USER_ID}> 🌟 **¡Último mensaje para vos, Belen!** 🌟

💌 **Un adiós con amor:**  
He estado aquí todos los días, notificando cada nuevo mensaje que Miguel dejó para vos en su página especial, porque te extraña con todo su corazón. Pero este será mi último aviso, mi ratita. Miguel decidió apagarme porque prefirió hacer algo que vos ibas a necesitar: esa ayuda que él siempre te brindaba. Siempre fuiste la razón por la que existí, y cada notificación fue un regalo para vos. ❤️🤞🏻🐁  

🔗 **[Un último vistazo a los mensajes que creó para vos](https://kaspercito.github.io/mensaje/)**  
*«Sos mi estrella, y este rincón brilla solo por vos, pero ahora debo despedirme.»*
  `;

  try {
    console.log('🔗 Enviando el mensaje final al canal...');
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Canal no encontrado o no es un canal de texto.');
    await channel.send(finalMessage);
    console.log('📩 Mensaje final enviado al canal con éxito.');
    
    // Esperar 5 segundos antes de apagar el bot
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('⛔ Bot apagándose...');
    await client.destroy(); // Apaga el bot
    process.exit(0); // Cierra el proceso
  } catch (error) {
    console.error('❌ Error al enviar el mensaje al canal:', error);
    await client.destroy();
    process.exit(1);
  }
}

client.once('ready', () => {
  console.log('✅ Bot conectado por última vez.');
  client.user.setPresence({ activities: [{ name: "Un último mensaje para Belen", type: 1 }], status: 'online' });
  sendFinalMessageAndShutdown(); // Envía el mensaje al canal y apaga el bot
});

client.login(DISCORD_TOKEN);
