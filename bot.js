// โหลดตัวแปรแวดล้อมจากไฟล์ .env เช่น DISCORD_TOKEN
require('dotenv').config();

// นำเข้าโมดูลที่จำเป็นจาก Discord.js และโมดูลอื่นๆ
const { Client, GatewayIntentBits, ActivityType } = require('discord.js'); // Client สำหรับบอท, Intents สำหรับการกำหนดสิทธิ์, ActivityType สำหรับสถานะ
const { REST } = require('@discordjs/rest'); // ใช้สำหรับการจัดการ API คำสั่ง Slash Commands
const { Routes } = require('discord-api-types/v9'); // เส้นทาง API เวอร์ชัน 9
const winston = require('winston'); // ใช้สำหรับการบันทึก log
const fs = require('fs'); // ใช้สำหรับการจัดการไฟล์
const path = require('path'); // ใช้สำหรับการจัดการเส้นทางไฟล์

// สร้าง Map เพื่อเก็บคำสั่ง Slash Commands ทั้งหมด
const commands = new Map();

// ตั้งค่า Logger สำหรับบันทึก log พร้อมสีและรูปแบบ
const logger = winston.createLogger({
  level: 'info', // ระดับ log ที่จะแสดง (info ขึ้นไป)
  format: winston.format.combine(
    winston.format.colorize({ all: true, colors: { info: 'green', warn: 'yellow', error: 'red', debug: 'cyan' } }), // เพิ่มสีให้ log
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // เพิ่มเวลาในรูปแบบที่กำหนด
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] - ${message}`) // รูปแบบข้อความ log
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize()) }), // แสดง log บนคอนโซลพร้อมสี
    new winston.transports.File({ filename: 'bot.log' }) // บันทึก log ลงไฟล์ bot.log
  ]
});

// สร้าง Client ของบอท Discord และกำหนด Intents (สิทธิ์ที่บอทต้องการ)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // เข้าถึงข้อมูลเซิร์ฟเวอร์ (Guild)
    GatewayIntentBits.GuildMessages, // อ่านข้อความในเซิร์ฟเวอร์
    GatewayIntentBits.MessageContent, // อ่านเนื้อหาของข้อความ
    GatewayIntentBits.GuildMembers, // เข้าถึงข้อมูลสมาชิกในเซิร์ฟเวอร์
    GatewayIntentBits.GuildMessageReactions, // เข้าถึงการตอบสนอง (reaction) ของข้อความ
  ]
});

// ตรวจสอบว่า DISCORD_TOKEN ถูกกำหนดใน .env หรือไม่ ถ้าไม่มีให้หยุดการทำงาน
if (!process.env.DISCORD_TOKEN) {
  logger.error('❌ DISCORD_TOKEN is not defined in the environment variables.');
  process.exit(1);
}

// สร้าง REST Client สำหรับการจัดการคำสั่ง Slash Commands ด้วย Discord API v9
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// โหลดไฟล์คำสั่งจากโฟลเดอร์ 'commands' และกรองเฉพาะไฟล์ .js
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
if (commandFiles.length === 0) {
  logger.warn('⚠️ No command files found in the "commands" folder.'); // เตือนถ้าไม่มีไฟล์คำสั่ง
}
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`); // โหลดไฟล์คำสั่ง
    if (!command.data?.name) { // ตรวจสอบว่าคำสั่งมีชื่อหรือไม่
      logger.warn(`⚠️ Command file ${file} is missing a valid name.`);
      continue; // ข้ามไฟล์นี้ถ้าไม่มีชื่อ
    }
    commands.set(command.data.name, command); // เก็บคำสั่งใน Map โดยใช้ชื่อเป็น key
    logger.info(`✅ Loaded command: ${command.data.name}`); // บันทึกว่าโหลดคำสั่งสำเร็จ
  } catch (error) {
    logger.error(`❌ Failed to load command ${file}:`, error); // บันทึกข้อผิดพลาดถ้าโหลดไม่สำเร็จ
  }
}

// เมื่อบอทพร้อมใช้งาน (ออนไลน์)
client.once('ready', async () => {
  try {
    const commandData = Array.from(commands.values()).map(cmd => cmd.data.toJSON()); // แปลงคำสั่งทั้งหมดเป็น JSON
    const existingCommands = await client.application.commands.fetch(); // ดึงคำสั่งที่มีอยู่แล้วจาก Discord
    if (existingCommands.size !== commandData.length) { // เปรียบเทียบจำนวนคำสั่ง ถ้าไม่เท่ากันให้ลงทะเบียนใหม่
      await client.application.commands.set(commandData); // ลงทะเบียนคำสั่ง Slash Commands
      logger.info('✅ Slash commands registered successfully!');
    } else {
      logger.info('ℹ️ Slash commands already up-to-date.'); // ถ้าคำสั่งเหมือนเดิม ไม่ต้องลงทะเบียนใหม่
    }

    // ตั้งค่าสถานะของบอท
    client.user.setPresence({
      status: 'dnd', // สถานะ "ห้ามรบกวน"
      activities: [{ name: 'ใน Discord!', type: ActivityType.Watching }], // บอทกำลัง "ดู" อะไร
    });
    logger.info('✅ Presence set successfully!');
  } catch (error) {
    logger.error('❌ Error registering slash commands or setting presence:', error); // บันทึกข้อผิดพลาดถ้ามี
  }
  logger.info('🚀 Bot is online!'); // บันทึกว่าบอทออนไลน์แล้ว
});

// ตรวจจับการโต้ตอบ (interaction) เช่น การใช้ Slash Commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return; // ถ้าไม่ใช่คำสั่ง Slash Command ให้ข้ามไป
  const { commandName } = interaction; // ดึงชื่อคำสั่งที่ผู้ใช้เรียก
  const command = commands.get(commandName); // หาคำสั่งจาก Map

  if (!command) { // ถ้าไม่พบคำสั่ง
    return interaction.reply({ content: '❌ คำสั่งไม่พบ', ephemeral: true }); // ตอบกลับแบบส่วนตัว (ephemeral)
  }

  try {
    await command.execute(interaction); // รันฟังก์ชัน execute ของคำสั่งนั้น
  } catch (error) {
    logger.error(`❌ Error executing slash command: ${commandName}`, error); // บันทึกข้อผิดพลาดถ้ามี
    await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการประมวลผลคำสั่ง', ephemeral: true }); // ตอบกลับผู้ใช้
  }
});

// ฟังข้อผิดพลาดทั่วไปของบอท
client.on('error', (error) => {
  logger.error('❌ Bot error:', error); // บันทึกข้อผิดพลาด
});

// จัดการข้อผิดพลาดที่ไม่ถูกจับ (Uncaught Exception)
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error); // บันทึกข้อผิดพลาด
  process.exit(1); // หยุดโปรแกรม
});

// จัดการ Promise ที่ไม่ถูกจัดการ (Unhandled Rejection)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection:', reason); // บันทึกข้อผิดพลาด
});

// เข้าสู่ระบบ Discord ด้วย Token
client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('✅ Bot logged in successfully!')) // บันทึกเมื่อเข้าสู่ระบบสำเร็จ
  .catch((error) => {
    logger.error('❌ Login failed:', error); // บันทึกเมื่อเข้าสู่ระบบล้มเหลว
    process.exit(1); // หยุดโปรแกรม
  });

// ตรวจจับการถูกจำกัดอัตราการใช้ API (Rate Limit)
client.on('rateLimit', (info) => {
  logger.warn(`⚠️ Rate limit hit: ${info.method} ${info.path} ${info.timeout}ms`); // บันทึกเมื่อถูกจำกัด
  if (info.timeout > 5000) { // ถ้าเวลารอนานเกิน 5 วินาที
    logger.error(`❌ Severe rate limit detected, waiting ${info.timeout}ms`); // บันทึกเป็นข้อผิดพลาดร้ายแรง
  }
});
