const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('ลบข้อความจำนวนที่ระบุ')
    .addIntegerOption(option => 
      option.setName('จำนวน')
        .setDescription('จำนวนข้อความที่ต้องการลบ (สูงสุด 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),  // กำหนดให้ใช้ได้เฉพาะคนที่มีสิทธิ์

  async execute(interaction) {
    try {
      // รับจำนวนข้อความที่จะลบ
      const amount = interaction.options.getInteger('จำนวน');

      // ตรวจสอบว่า interaction.channel มีอยู่ และเป็นประเภทข้อความหรือไม่
      if (!interaction.channel || !interaction.channel.isTextBased()) {
        return interaction.reply({ content: 'คำสั่งนี้ใช้ได้เฉพาะในช่องข้อความเท่านั้น!', ephemeral: true });
      }

      // เช็คสิทธิ์การลบข้อความ
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: 'คุณไม่มีสิทธิ์ในการลบข้อความ', ephemeral: true });
      }

      // ดึงข้อความมาเพื่อลบ
      const messages = await interaction.channel.messages.fetch({ limit: amount });

      // ตรวจสอบว่ามีข้อความให้ลบหรือไม่
      if (messages.size === 0) {
        return interaction.reply({ content: 'ไม่พบข้อความที่จะลบ', ephemeral: true });
      }

      // ลบข้อความที่มีอายุต่ำกว่า 14 วัน
      await interaction.channel.bulkDelete(messages, true);

      // แจ้งเตือนว่าเคลียร์ข้อความเสร็จแล้ว
      await interaction.reply({ content: `✅ ลบข้อความทั้งหมด **${messages.size}** ข้อความเรียบร้อยแล้ว!`, ephemeral: true });
    } catch (error) {
      console.error('Error clearing messages:', error);
      await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการลบข้อความ!', ephemeral: true });
    }
  },
};
