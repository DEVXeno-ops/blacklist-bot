const { SlashCommandBuilder } = require('@discordjs/builders');  // ห้ามลบ

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('แสดงเวลาที่บอททำงาน'),

  async execute(interaction) {
    const uptime = interaction.client.uptime;
    await interaction.reply(`The bot has been online for ${Math.floor(uptime / 1000)} seconds.`);
  },
};
