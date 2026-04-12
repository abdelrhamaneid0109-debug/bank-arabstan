const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { createUser, getUser } = require("../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("فلوسي")
    .setDescription("عرض رصيدك بشكل احترافي"),

  async execute(interaction) {
    const id = interaction.user.id;

    await createUser(id);
    const user = await getUser(id);

    // 🎨 UI Embed
    const embed = new EmbedBuilder()
      .setTitle("💰 حسابك")
      .setColor(0xFFD700) // لون دهبي
      .setDescription(`
👤 المستخدم: **${interaction.user.username}**

━━━━━━━━━━━━━━
🟤 **النحاس:** ${user.copper}
⚪ **الفضة:** ${user.silver}
🟡 **الذهب:** ${user.gold}
━━━━━━━━━━━━━━
      `)
      .setFooter({ text: "Arabstan System 💀" })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral // 🔒 سري
    });
  },
};
