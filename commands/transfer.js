const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { createUser, getUser, updateUser } = require("../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("حول")
    .setDescription("تحويل فلوس")
    .addUserOption(option =>
      option.setName("الشخص").setDescription("المستلم").setRequired(true))
    .addStringOption(option =>
      option.setName("العملة")
        .setDescription("نوع العملة")
        .setRequired(true)
        .addChoices(
          { name: "نحاس", value: "copper" },
          { name: "فضة", value: "silver" },
          { name: "ذهب", value: "gold" }
        ))
    .addIntegerOption(option =>
      option.setName("المبلغ").setDescription("المبلغ المراد تحويله").setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const target = interaction.options.getUser("الشخص");
    const type = interaction.options.getString("العملة");
    const amount = interaction.options.getInteger("المبلغ");

    if (amount <= 0)
      return interaction.reply({ content: "❌ رقم غلط", flags: MessageFlags.Ephemeral });

    await createUser(userId);
    await createUser(target.id);

    let user = await getUser(userId);
    let targetUser = await getUser(target.id);

    if (user[type] < amount)
      return interaction.reply({ content: "❌ معكش فلوس", flags: MessageFlags.Ephemeral });

    user[type] -= amount;
    targetUser[type] += amount;

    await updateUser(userId, user);
    await updateUser(target.id, targetUser);

    interaction.reply(`✅ حولت ${amount} لـ ${target.username}`);
  },
};