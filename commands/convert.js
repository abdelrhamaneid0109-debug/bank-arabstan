const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getUser, updateUser, createUser } = require("../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("تحويل")
    .setDescription("تحويل تلقائي"),

  async execute(interaction) {
    const id = interaction.user.id;

    await createUser(id);
    let user = await getUser(id);

    let converted = false;

    if (user.copper >= 100) {
      const silver = Math.floor(user.copper / 100);
      user.copper -= silver * 100;
      user.silver += silver;
      converted = true;
    }

    if (user.silver >= 100) {
      const gold = Math.floor(user.silver / 100);
      user.silver -= gold * 100;
      user.gold += gold;
      converted = true;
    }

    if (!converted)
      return interaction.reply({ content: "❌ معندكش كفاية", flags: MessageFlags.Ephemeral });

    await updateUser(id, user);

    interaction.reply("💱 تم التحويل");
  },
};