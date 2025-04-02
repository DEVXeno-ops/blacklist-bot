# **โค้ด Discord Bot อธิบายโดยละเอียด**

โค้ดนี้เป็น **Discord Bot** ที่ใช้ **Node.js** และ **discord.js v14** รองรับ **Slash Commands** พร้อมการจัดการข้อผิดพลาดและการทำ Log ด้วย **winston**  
🔹 เหมาะสำหรับการศึกษาและใช้งานในเซิร์ฟเวอร์ Discord  
🔹 รองรับคำสั่งที่โหลดจากโฟลเดอร์ `commands/`  
🔹 มีระบบป้องกัน Rate Limit และตรวจสอบข้อผิดพลาด  

---

## **📌 การเตรียมพร้อมก่อนใช้งาน**
1. ติดตั้ง Node.js และ npm  
2. ติดตั้งแพ็กเกจที่จำเป็นโดยรันคำสั่ง:
   ```sh
   npm install discord.js @discordjs/rest discord-api-types winston dotenv
   ```
3. สร้างไฟล์ `.env` และใส่ **Token** ของบอท:
   ```
   DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
   ```

---

## **📜 โครงสร้างของโค้ด**
### **1️⃣ เรียกใช้ไลบรารีและตั้งค่า .env**
```js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
```
📌 โหลด **dotenv** เพื่อใช้ตัวแปร `.env` และนำเข้าไลบรารีที่จำเป็น  
📌 ใช้ **winston** สำหรับ logging  

---

### **2️⃣ สร้างระบบ Logger ด้วย winston**
```js
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' })
  ]
});
```
📌 สร้าง **logger** ที่แสดง log ทั้งใน **console** และบันทึกลงไฟล์ `bot.log`  
📌 ระบุระดับของ log เป็น `info`  

---

### **3️⃣ สร้าง Client ของบอท**
```js
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});
```
📌 ใช้ **GatewayIntentBits** เพื่อให้บอทรับฟังข้อความในเซิร์ฟเวอร์  
📌 ตั้งค่า **intents** ให้รองรับการอ่านข้อความและคำสั่ง  

---

### **4️⃣ ตรวจสอบ Token**
```js
if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN is not defined in the environment variables.');
  process.exit(1);
}
```
📌 เช็คว่ามี `DISCORD_TOKEN` หรือไม่ ถ้าไม่มีให้ **ปิดโปรแกรม**  

---

### **5️⃣ โหลด Slash Commands**
```js
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command);
  } catch (error) {
    logger.error(`Failed to load command ${file}:`, error);
  }
}
```
📌 อ่านไฟล์ทั้งหมดใน `commands/`  
📌 ตรวจสอบและเพิ่มคำสั่งลง **Map** เพื่อใช้ภายในบอท  
📌 หากโหลดคำสั่งไม่ได้ ให้ **log ข้อผิดพลาด**  

---

### **6️⃣ เมื่อตัวบอทออนไลน์**
```js
client.once('ready', async () => {
  try {
    const commandData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandData);
    logger.info('Slash commands registered successfully!');

    client.user.setPresence({
      status: 'dnd',
      activities: [{ name: 'ใน Discord!', type: 'WATCHING' }],
    });
    logger.info('Presence set successfully!');
  } catch (error) {
    logger.error('Error registering slash commands:', error);
  }
  logger.info('Bot is online!');
});
```
📌 เมื่อบอทออนไลน์จะ:  
✅ **ลงทะเบียน Slash Commands**  
✅ **ตั้งสถานะ** เป็น `dnd` (Do Not Disturb) พร้อมข้อความ  
✅ **แสดง log** ว่าบอทพร้อมใช้งาน  

---

### **7️⃣ จัดการ Slash Commands**
```js
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  const command = commands.get(commandName);

  if (!command) {
    return interaction.reply({ content: 'คำสั่งไม่พบ', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing slash command: ${commandName}`, error);
    await interaction.reply({ content: 'เกิดข้อผิดพลาดในการประมวลผลคำสั่ง', ephemeral: true });
  }
});
```
📌 ตรวจสอบว่า **เป็นคำสั่งจริงหรือไม่**  
📌 ถ้าพบคำสั่ง จะ **เรียกใช้คำสั่งที่โหลดไว้**  
📌 ถ้าเกิดข้อผิดพลาด จะ **แจ้งผู้ใช้และบันทึก log**  

---

### **8️⃣ จัดการข้อผิดพลาด**
```js
client.on('error', (error) => {
  logger.error('Bot error:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
```
📌 **บันทึกข้อผิดพลาด** ของบอทและป้องกันการพัง  

---

### **9️⃣ ระบบ Login**
```js
client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('Bot logged in successfully!'))
  .catch((error) => {
    logger.error('Login failed:', error);
    process.exit(1);
  });
```
📌 ถ้า Login **สำเร็จ** จะบันทึก log  
📌 ถ้า Login **ล้มเหลว** บอทจะหยุดทำงาน  

---

### **🔟 ป้องกัน Rate Limit**
```js
client.on('rateLimit', (info) => {
  logger.warn(`Rate limit hit: ${info.method} ${info.path} ${info.timeout}ms`);
});
```
📌 แจ้งเตือนเมื่อ Discord API จำกัดการใช้งาน  

---

## **📌 ตัวอย่างโฟลเดอร์ `commands/`**
```
/my-bot/
 ├── bot.js
 ├── .env
 ├── bot.log
 ├── commands/
 │   ├── ping.js
 │   ├── uptime.js
 │   ├── clear.js
 ├── package.json
 ├── package-lock.json
```
🔹 **แต่ละไฟล์ใน `commands/` เป็นคำสั่งของบอท**  
🔹 เช่น `ping.js` อาจเป็นคำสั่ง `/ping` ที่ตอบกลับ `"Pong!"`  

---

## **🎯 สรุป**
✅ รองรับ **Slash Commands**  
✅ ใช้ **Logging (winston)** สำหรับ Debugging  
✅ ป้องกัน **Rate Limit** และ **ข้อผิดพลาดร้ายแรง**  
✅ ระบบ **โหลดคำสั่งอัตโนมัติ** จากโฟลเดอร์ `commands/`  
✅ พร้อมใช้งานใน **Node.js** และ **discord.js v14**  

💡 **พร้อมใช้โค้ดนี้? ลองสร้างคำสั่งใน `commands/` แล้วรัน `node bot.js` ได้เลย! 🚀**
