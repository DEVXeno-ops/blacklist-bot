const { SlashCommandBuilder } = require('@discordjs/builders'); // โหลด SlashCommandBuilder สำหรับสร้างคำสั่ง Slash
const { EmbedBuilder } = require('discord.js'); // โหลด EmbedBuilder สำหรับสร้าง Embed message

module.exports = {
  // กำหนดข้อมูลของคำสั่ง
  data: new SlashCommandBuilder()
    .setName('uptime') // ตั้งชื่อคำสั่ง
    .setDescription('แสดงเวลาที่บอททำงาน'), // คำอธิบายคำสั่ง

  // ฟังก์ชั่นสำหรับการดำเนินการเมื่อคำสั่งถูกเรียก
  async execute(interaction) {
    try {
      // ดึงเวลาที่บอททำงาน
      const uptime = interaction.client.uptime;

      // ตรวจสอบว่า uptime ถูกต้องหรือไม่
      if (!uptime) {
        // ถ้าไม่มีข้อมูล uptime หรือมีปัญหาการดึงข้อมูล
        return interaction.reply({ content: 'บอทยังไม่ได้ทำงานหรือมีข้อผิดพลาดในการดึงข้อมูล uptime!', flags: 64 }); // ใช้ flags แทน ephemeral
      }

      // แปลงเวลา uptime จากมิลลิวินาทีเป็นวัน ชั่วโมง นาที วินาที
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24)); // คำนวณจำนวนวัน
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); // คำนวณจำนวนชั่วโมง
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60)); // คำนวณจำนวน นาที
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000); // คำนวณจำนวน วินาที

      // สร้าง Embed message สำหรับแสดงข้อมูล uptime
      const embed = new EmbedBuilder()
        .setColor('#1E90FF') // กำหนดสีของ Embed
        .setTitle('🕰️ **Uptime Information** 🕰️') // หัวข้อของ Embed
        .setDescription(`
          **⏳ เวลาที่บอททำงาน:**  
          🗓️ **${days} วัน**  
          ⏰ **${hours} ชั่วโมง**  
          ⏲️ **${minutes} นาที**  
          ⚡ **${seconds} วินาที**  
        `) // ข้อความภายใน Embed ที่แสดงเวลาทั้งหมด
        .setFooter({ text: 'ขอบคุณที่ใช้บริการบอทของเรา!' }) // ข้อความท้าย Embed
        .setTimestamp() // เพิ่ม timestamp ใน Embed
        .setThumbnail('https://i.imgur.com/7Ikh67A.png') // เพิ่มภาพเล็ก (thumbnail)
        .setImage('https://i.imgur.com/6uHO41R.png'); // เพิ่มภาพใหญ่ใน Embed

      // ส่ง Embed ที่เป็นข้อความชั่วคราว (Ephemeral Message)
      await interaction.reply({ embeds: [embed], flags: 64 }); // ใช้ flags แทน ephemeral เพื่อไม่ให้เกิดคำเตือน
    } catch (error) {
      // หากเกิดข้อผิดพลาดในการทำงาน
      console.error('Error executing /uptime:', error); // บันทึกข้อผิดพลาดใน console
      await interaction.reply({ content: 'เกิดข้อผิดพลาดในการดึง uptime!', flags: 64 }); // แจ้งข้อผิดพลาดแก่ผู้ใช้
    }
  },
};
