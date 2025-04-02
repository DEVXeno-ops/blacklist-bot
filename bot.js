require('dotenv').config(); // โหลดค่า .env เพื่อใช้ตัวแปรแวดล้อม
const { Client, GatewayIntentBits } = require('discord.js'); // โหลด discord.js
const { REST } = require('@discordjs/rest'); // สำหรับลงทะเบียน Slash Commands
const { Routes } = require('discord-api-types/v9'); // ใช้ API v9
const winston = require('winston'); // ใช้ winston สำหรับ logging
const fs = require('fs'); // ใช้ fs เพื่ออ่านไฟล์
const path = require('path'); // ใช้ path จัดการ path ของไฟล์

const commands = new Map(); // เก็บคำสั่งทั้งหมดไว้ใน Map

// กำหนดค่าการทำงานของ Logger
const logger = winston.createLogger({
  level: 'info', // กำหนดระดับ log
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // แสดง log บน Console
    new winston.transports.File({ filename: 'bot.log' }) // บันทึก log ลงไฟล์
  ]
});

// สร้าง Client ของ Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // ให้บอทเข้าถึงข้อมูลเซิร์ฟเวอร์
    GatewayIntentBits.GuildMessages, // ให้บอทอ่านข้อความในเซิร์ฟเวอร์
    GatewayIntentBits.MessageContent, // ให้บอทอ่านข้อความที่ส่งมา
  ]
});

// ตรวจสอบว่า DISCORD_TOKEN มีค่าหรือไม่
if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN is not defined in the environment variables.');
  process.exit(1); // ปิดโปรแกรมถ้าไม่มี Token
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// โหลดคำสั่งทั้งหมดจากโฟลเดอร์ commands/
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command); // เพิ่มคำสั่งลง Map
  } catch (error) {
    logger.error(`Failed to load command ${file}:`, error); // บันทึก log ถ้าโหลดคำสั่งไม่สำเร็จ
  }
}

// เมื่อบอทออนไลน์
client.once('ready', async () => {
  try {
    const commandData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandData); // ลงทะเบียน Slash Commands
    logger.info('Slash commands registered successfully!');

    // ตั้งค่าสถานะของบอท
    client.user.setPresence({
      status: 'dnd', // แสดงสถานะ Do Not Disturb
      activities: [{ name: 'ใน Discord!', type: 'WATCHING' }], // กำหนดกิจกรรมที่บอทกำลังทำ
    });
    logger.info('Presence set successfully!');
  } catch (error) {
    logger.error('Error registering slash commands:', error);
  }
  logger.info('Bot is online!');
});

// ตรวจจับคำสั่งจากผู้ใช้
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  const command = commands.get(commandName);

  if (!command) {
    return interaction.reply({ content: 'คำสั่งไม่พบ', ephemeral: true });
  }

  try {
    await command.execute(interaction); // ทำคำสั่งที่ผู้ใช้เรียก
  } catch (error) {
    logger.error(`Error executing slash command: ${commandName}`, error);
    await interaction.reply({ content: 'เกิดข้อผิดพลาดในการประมวลผลคำสั่ง', ephemeral: true });
  }
});

// จัดการข้อผิดพลาดของบอท
client.on('error', (error) => {
  logger.error('Bot error:', error);
});

// จัดการข้อผิดพลาดร้ายแรง
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1); // ปิดโปรแกรมทันที
});

// เข้าสู่ระบบ Discord ด้วย Token
client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('Bot logged in successfully!'))
  .catch((error) => {
    logger.error('Login failed:', error);
    process.exit(1);
  });

// ตรวจจับ Rate Limit ของ Discord API
client.on('rateLimit', (info) => {
  logger.warn(`Rate limit hit: ${info.method} ${info.path} ${info.timeout}ms`);
});