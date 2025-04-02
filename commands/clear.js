const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js'); // นำเข้าคลาสที่จำเป็นจาก discord.js

module.exports = {
  // สร้างคำสั่ง Slash Command ที่ใช้ชื่อว่า 'clear' 
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('ลบข้อความจำนวนที่ระบุ')
    .addIntegerOption(option => 
      option.setName('จำนวน')  // ตั้งชื่อให้กับตัวเลือกจำนวนข้อความที่ต้องการลบ
        .setDescription('จำนวนข้อความที่ต้องการลบ (สูงสุด 100)')  // คำอธิบายตัวเลือก
        .setRequired(true)  // กำหนดให้ตัวเลือกนี้เป็นตัวเลือกที่จำเป็น
        .setMinValue(1)  // จำนวนต่ำสุดที่สามารถลบได้คือ 1
        .setMaxValue(100)  // จำนวนสูงสุดที่สามารถลบได้คือ 100
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),  // กำหนดให้ใช้คำสั่งนี้ได้เฉพาะผู้ที่มีสิทธิ์ 'Manage Messages' เท่านั้น

  // ฟังก์ชั่นที่ใช้ในการดำเนินการคำสั่ง 'clear'
  async execute(interaction) {
    try {
      // รับจำนวนข้อความที่ต้องการลบจากผู้ใช้
      const amount = interaction.options.getInteger('จำนวน'); 

      // ตรวจสอบว่า interaction.channel เป็นช่องข้อความและไม่เป็นช่องประเภทอื่น (เช่น ช่องเสียง)
      if (!interaction.channel || !interaction.channel.isTextBased()) {
        return interaction.reply({ content: 'คำสั่งนี้ใช้ได้เฉพาะในช่องข้อความเท่านั้น!', ephemeral: true });
      }

      // ตรวจสอบสิทธิ์การใช้คำสั่ง 'Manage Messages' ของสมาชิก
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: 'คุณไม่มีสิทธิ์ในการลบข้อความ', ephemeral: true });
      }

      // ดึงข้อความจากช่องเพื่อทำการลบ
      const messages = await interaction.channel.messages.fetch({ limit: amount });

      // ตรวจสอบว่ามีข้อความในช่องนั้นหรือไม่
      if (messages.size === 0) {
        return interaction.reply({ content: 'ไม่พบข้อความที่จะลบ', ephemeral: true });
      }

      // ลบข้อความทั้งหมดที่ดึงมา (ยกเว้นข้อความที่มีอายุมากกว่า 14 วัน)
      const deletedMessages = await interaction.channel.bulkDelete(messages, true);

      // สร้าง Embed สำหรับตอบกลับเพื่อแสดงผลที่สวยงาม
      const embed = new EmbedBuilder()
        .setColor('#FF4500')  // กำหนดสีของ Embed
        .setTitle('🧹 **ลบข้อความสำเร็จ** 🧹')  // กำหนดชื่อ Embed
        .setDescription(`**ลบข้อความจำนวน ${deletedMessages.size} ข้อความเรียบร้อยแล้ว!**`)  // ข้อความหลัก
        .addFields(
          { name: 'จำนวนข้อความที่ลบ:', value: `${deletedMessages.size} ข้อความ`, inline: true },  // แสดงจำนวนข้อความที่ลบ
          { name: 'วันที่/เวลา:', value: new Date().toLocaleString(), inline: true }  // แสดงวันที่และเวลา
        )
        .setFooter({ text: 'ขอให้การใช้งาน Discord ของคุณเป็นไปอย่างราบรื่น!' })  // ข้อความท้าย Embed
        .setTimestamp()  // เพิ่ม timestamp เพื่อแสดงเวลา
        .setThumbnail('https://i.imgur.com/7Ikh67A.png');  // เพิ่มรูป thumbnail

      // ส่ง Embed ที่ตอบกลับ
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      // หากเกิดข้อผิดพลาดในการดำเนินการ ให้แสดงข้อความแสดงข้อผิดพลาด
      console.error('Error clearing messages:', error); 
      
      // สร้าง Embed สำหรับแสดงข้อผิดพลาด
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')  // ใช้สีแดงสำหรับข้อผิดพลาด
        .setTitle('❌ **เกิดข้อผิดพลาด** ❌')
        .setDescription('เกิดข้อผิดพลาดในการลบข้อความ โปรดลองใหม่อีกครั้ง!')
        .setFooter({ text: 'หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
