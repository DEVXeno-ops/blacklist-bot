const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('แสดงเวลาที่บอททำงาน'),

  async execute(interaction) {
    try {
      const uptime = interaction.client.uptime;

      if (!uptime) {
        return interaction.reply({ content: 'บอทยังไม่ได้ทำงานหรือมีข้อผิดพลาดในการดึงข้อมูล uptime!', ephemeral: true });
      }

      // แปลงเวลาเป็นวัน ชั่วโมง นาที วินาที
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

      // สร้าง Embed ด้วย EmbedBuilder
      const embed = new EmbedBuilder()
        .setColor('#1E90FF')
        .setTitle('🕰️ **Uptime Information** 🕰️')
        .setDescription(`
          **⏳ เวลาที่บอททำงาน:**  
          🗓️ **${days} วัน**  
          ⏰ **${hours} ชั่วโมง**  
          ⏲️ **${minutes} นาที**  
          ⚡ **${seconds} วินาที**  
        `)
        .setFooter({ text: 'ขอบคุณที่ใช้บริการบอทของเรา!' })
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/7Ikh67A.png')
        .setImage('https://i.imgur.com/6uHO41R.png');

      // ส่ง Embed ที่เป็นข้อความชั่วคราว (Ephemeral Message)
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error executing /uptime:', error);
      await interaction.reply({ content: 'เกิดข้อผิดพลาดในการดึง uptime!', ephemeral: true });
    }
  },
};
