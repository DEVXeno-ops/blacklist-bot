require('dotenv').config(); // โหลดค่าตัวแปรแวดล้อมจากไฟล์ .env เช่น DISCORD_TOKEN
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js'); // โหลด Discord.js API ที่จำเป็น
const { REST } = require('@discordjs/rest'); // ใช้สำหรับการลงทะเบียน Slash Commands
const { Routes } = require('discord-api-types/v9'); // ใช้สำหรับการเข้าถึงเส้นทางใน API
const winston = require('winston'); // ใช้สำหรับการบันทึก Log
const fs = require('fs'); // ใช้สำหรับการจัดการไฟล์
const path = require('path'); // ใช้สำหรับการจัดการ path

// สร้าง Map สำหรับเก็บคำสั่งทั้งหมด
const commands = new Map();

// การตั้งค่า Logger พร้อมสี
const logger = winston.createLogger({
  level: 'info', // ระดับการแสดงผล log
  format: winston.format.combine(
    winston.format.colorize({
      all: true, // เปิดใช้สีให้กับทุกข้อความ
      colors: {
        info: 'green', // สีเขียวสำหรับ info
        warn: 'yellow', // สีเหลืองสำหรับ warn
        error: 'red', // สีแดงสำหรับ error
        debug: 'cyan', // สีฟ้าอมเขียวสำหรับ debug
      }
    }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // เพิ่ม timestamp แบบสวยงาม
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}] - ${message}`; // กำหนดรูปแบบการแสดง log
    })
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize()) }), // แสดง log บน console
    new winston.transports.File({ filename: 'bot.log' }) // บันทึก log ลงในไฟล์ bot.log
  ]
});

// สร้าง Client ของ Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // ให้บอทเข้าถึงข้อมูลของ Guild
    GatewayIntentBits.GuildMessages, // ให้บอทอ่านข้อความจาก Guild
    GatewayIntentBits.MessageContent, // ให้บอทอ่านข้อความทั้งหมด
    GatewayIntentBits.GuildMembers, // ให้บอทเข้าถึงข้อมูลสมาชิกของ Guild
    GatewayIntentBits.GuildMessageReactions, // ให้บอทเข้าถึงข้อมูลการตอบสนองจากข้อความ
  ]
});

// ตรวจสอบว่า DISCORD_TOKEN ถูกกำหนดใน environment variables หรือไม่
if (!process.env.DISCORD_TOKEN) {
  logger.error('❌ DISCORD_TOKEN is not defined in the environment variables.'); // ถ้าไม่มีให้บันทึก log และหยุดการทำงาน
  process.exit(1); 
}

// สร้าง REST client สำหรับการใช้งาน Discord API v9
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// โหลดคำสั่งทั้งหมดจากโฟลเดอร์ 'commands' และเพิ่มลงใน Map
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command); // เพิ่มคำสั่งลงใน Map
  } catch (error) {
    logger.error(`❌ Failed to load command ${file}:`, error); // หากโหลดคำสั่งไม่สำเร็จให้บันทึก log
  }
}

// เมื่อบอทออนไลน์
client.once('ready', async () => {
  try {
    // ลงทะเบียนคำสั่งทั้งหมด
    const commandData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandData); // ลงทะเบียนคำสั่ง
    logger.info('✅ Slash commands registered successfully!'); // บันทึก log ว่าการลงทะเบียนสำเร็จ

    // ตั้งค่าสถานะของบอท
    client.user.setPresence({
      status: 'dnd', // สถานะ "Do Not Disturb"
      activities: [{ name: 'ใน Discord!', type: 'WATCHING' }], // บอทกำลังดูอะไร
    });
    logger.info('✅ Presence set successfully!'); // บันทึก log ว่าการตั้งค่าสถานะสำเร็จ
  } catch (error) {
    logger.error('❌ Error registering slash commands or setting presence:', error); // หากเกิดข้อผิดพลาดในการลงทะเบียนคำสั่งหรือการตั้งสถานะ
  }
  logger.info('🚀 Bot is online!'); // บันทึก log ว่าบอทออนไลน์แล้ว
});

// ตรวจจับเมื่อมีการสร้าง interaction และรับคำสั่งจากผู้ใช้
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return; // ถ้าไม่ใช่คำสั่งก็ไม่ต้องทำอะไร
  const { commandName } = interaction; // ดึงชื่อคำสั่งที่ถูกเรียก
  const command = commands.get(commandName); // หาคำสั่งจาก Map

  // ถ้าคำสั่งไม่พบ
  if (!command) {
    return interaction.reply({ content: '❌ คำสั่งไม่พบ', flags: MessageFlags.FLAGS.Ephemeral }); // ตอบกลับคำสั่งไม่พบ
  }

  // หากพบคำสั่ง ให้ทำการ execute คำสั่ง
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`❌ Error executing slash command: ${commandName}`, error); // หากเกิดข้อผิดพลาดในการ execute
    await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการประมวลผลคำสั่ง', flags: MessageFlags.FLAGS.Ephemeral }); // แจ้งข้อผิดพลาด
  }
});

// ฟังข้อผิดพลาดที่เกิดขึ้นในบอท
client.on('error', (error) => {
  logger.error('❌ Bot error:', error); // บันทึกข้อผิดพลาด
});

// การจัดการข้อผิดพลาดที่เกิดจาก Uncaught Exception
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error); // บันทึกข้อผิดพลาด
  process.exit(1); // หยุดการทำงานของโปรแกรม
});

// การจัดการ Promise ที่ไม่ได้รับการจัดการ
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection:', reason); // บันทึกข้อผิดพลาด
});

// เข้าสู่ระบบ Discord ด้วย Token จาก environment variable
client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('✅ Bot logged in successfully!')) // ถ้าเข้าสู่ระบบสำเร็จ ให้บันทึก log
  .catch((error) => {
    logger.error('❌ Login failed:', error); // ถ้าเข้าสู่ระบบไม่สำเร็จ ให้บันทึก log และหยุดการทำงาน
    process.exit(1);
  });

// ตรวจจับการถูกจำกัดอัตราการใช้ API (Rate Limit)
client.on('rateLimit', (info) => {
  logger.warn(`⚠️ Rate limit hit: ${info.method} ${info.path} ${info.timeout}ms`); // บันทึก log การ hit rate limit
});
