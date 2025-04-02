const { SlashCommandBuilder } = require('@discordjs/builders');  // ห้ามลบ
const { EmbedBuilder } = require('discord.js');  // ใช้ EmbedBuilder แทน MessageEmbed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('แสดงเวลาที่บอททำงาน'),

  async execute(interaction) {
    const uptime = interaction.client.uptime;

    // แปลงเวลาเป็นวัน ชั่วโมง นาที วินาที
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    // สร้าง Embed ด้วย EmbedBuilder
    const embed = new EmbedBuilder()
      .setColor('#1E90FF')  // ใช้สีฟ้าที่ดูทันสมัย
      .setTitle('🕰️ **Uptime Information** 🕰️')  // ใช้ไอคอนเพื่อดึงความสนใจ
      .setDescription(`
        **⏳ เวลาที่บอททำงาน:**  
        🗓️ **${days} วัน**  
        ⏰ **${hours} ชั่วโมง**  
        ⏲️ **${minutes} นาที**  
        ⚡ **${seconds} วินาที**  
      `)  // การจัดข้อความที่เรียบง่ายและสะดุดตา
      .setFooter({ text: 'ขอบคุณที่ใช้บริการบอทของเรา!' })
      .setTimestamp()  // แสดงเวลาที่ส่งคำตอบ
      .setThumbnail('https://i.imgur.com/7Ikh67A.png')  // เพิ่มภาพ thumbnail ที่ดูทันสมัย
      .setImage('https://i.imgur.com/6uHO41R.png');  // เพิ่มภาพที่ให้ความรู้สึกหรูหรา

    // ส่ง Embed ให้กับผู้ใช้งาน
    await interaction.reply({ embeds: [embed] });
  },
};
