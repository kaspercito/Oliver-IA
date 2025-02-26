import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages // Necesario para enviar MD
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const BELEN_USER_ID = process.env.BELEN_USER_ID; // Agrega el ID de Belen en tu archivo .env

async function sendFinalMessageAndShutdown() {
  const finalMessage = `
🌟 **¡Último mensaje para vos, Belen!** 🌟

💌 **Un adiós con amor:**  
He estado aquí todos los días, notificando cada nuevo mensaje que Miguel dejó para vos en su página especial, porque te extraña con todo su corazón. Pero este será mi último aviso, mi ratita. Miguel decidió apagarme porque prefirió hacer algo que vos ibas a necesitar: esa ayuda que él siempre te brindaba. Siempre fuiste la razón por la que existí, y cada notificación fue un regalo para vos. ❤️🤞🏻🐁  

🔗 **[Un último vistazo a los mensajes que creó para vos](https://kaspercito.github.io/mensaje/)**  
*«Sos mi estrella, y este rincón brilla solo por vos, pero ahora debo despedirme.»*
  `;

  try {
    console.log('🔗 Enviando el mensaje final por MD a Belen...');
    const user = await client.users.fetch(BELEN_USER_ID);
    if (!user) throw new Error('Usuario no encontrado o inaccesible.');
    await user.send(finalMessage);
    console.log('📩 Mensaje final enviado por MD con éxito.');
    
    // Esperar 5 segundos antes de apagar el bot
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('⛔ Bot apagándose...');
    await client.destroy(); // Apaga el bot
    process.exit(0); // Cierra el proceso
  } catch (error) {
    console.error('❌ Error al enviar el mensaje por MD:', error);
    await client.destroy();
    process.exit(1);
  }
}

// Llama a esta función cuando quieras que el bot envíe el mensaje final y se apague
client.once('ready', () => {
  console.log('✅ Bot conectado por última vez.');
  client.user.setPresence({ activities: [{ name: "Un último mensaje para Belen", type: 1 }], status: 'online' });
  sendFinalMessageAndShutdown(); // Envia el mensaje por MD y apaga el bot
});

client.login(DISCORD_TOKEN);
