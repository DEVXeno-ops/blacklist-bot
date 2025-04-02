require('dotenv').config();  // โหลดค่าจาก .env
const { Client, GatewayIntentBits } = require('discord.js');
const winston = require('winston');  // ติดตั้ง winston สำหรับ logging

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

// เมื่อ bot เข้าสู่ระบบและพร้อมใช้งาน
client.once('ready', () => {
  logger.info('Bot is online!');

  try {
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
    logger.error('Error setting bot presence:', error);
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
