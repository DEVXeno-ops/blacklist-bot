require('dotenv').config();  // โหลดค่าจาก .env
const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const winston = require('winston');  // ติดตั้ง winston สำหรับ logging
const fs = require('fs');
const path = require('path');

const commands = new Map();

// สร้างตัวจัดการ log ด้วย winston
const logger = winston.createLogger({
  level: 'info',  // ระดับของ log
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),  // แสดงผลใน console
    new winston.transports.File({ filename: 'bot.log' })  // บันทึก log ลงไฟล์
  ]
});

// สร้าง client ของ Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// ใช้ token จาก .env เพื่อเข้าสู่ระบบ
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// โหลดคำสั่งจากโฟลเดอร์ 'commands'
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.data.name, command);  // เพิ่มคำสั่งลงใน Map
}

// ลงทะเบียนคำสั่ง Slash ในทุกเซิร์ฟเวอร์
client.once('ready', async () => {
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),  // ลงทะเบียนคำสั่งในทุกเซิร์ฟเวอร์
      { body: commands }
    );
    logger.info('Slash commands registered successfully!');

    // ตั้งค่าสถานะของ bot
    client.user.setPresence({
      status: 'dnd',  // สถานะของ bot (online, idle, dnd, invisible)
      activities: [{
        name: 'ใน Discord!', // กิจกรรมที่ bot กำลังทำ (แสดงในสถานะ)
        type: 'WATCHING',    // ประเภทของกิจกรรม (PLAYING, WATCHING, LISTENING, STREAMING)
      }],
    });
    logger.info('Presence set successfully!');
  } catch (error) {
    logger.error('Error registering slash commands:', error);
  }

  logger.info('Bot is online!');
});

// เมื่อผู้ใช้ใช้คำสั่ง Slash
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const command = commands.get(commandName);  // ดึงคำสั่งที่ต้องการจาก Map
  
  if (!command) return;  // ถ้าไม่พบคำสั่งก็ไม่ทำอะไร

  try {
    // เรียกใช้คำสั่ง
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing slash command: ${commandName}`, error);
    await interaction.reply('There was an error while executing that command.');
  }
});

// จับข้อผิดพลาดที่เกิดจากการเชื่อมต่อของ bot
client.on('error', (error) => {
  logger.error('Bot error:', error);
});

// จับข้อผิดพลาดที่ไม่ได้ถูกจับในส่วนของโค้ด
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

// ใช้ token จาก .env เพื่อเข้าสู่ระบบ
client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('Bot logged in successfully!'))
  .catch((error) => logger.error('Login failed:', error));

// เพิ่มการป้องกัน rate limiting
client.on('rateLimit', (info) => {
  logger.warn(`Rate limit hit: ${info.method} ${info.path} ${info.timeout}ms`);
});