const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createUser, getUser, updateUser } = require("../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("اضافة")
    .setDescription("إضافة فلوس لعضو")
    .addUserOption(option =>
      option.setName("الشخص").setDescription("العضو").setRequired(true))
    .addStringOption(option =>
      option.setName("العملة")
        .setDescription("نوع العملة")
        .setRequired(true)
        .addChoices(
          { name: "نحاس 🟤", value: "copper" },
          { name: "فضة ⚪", value: "silver" },
          { name: "ذهب 🟡", value: "gold" }
        ))
    .addIntegerOption(option =>
      option.setName("المبلغ")
        .setDescription("المبلغ")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser("الشخص");
    const type = interaction.options.getString("العملة");
    const amount = interaction.options.getInteger("المبلغ");

    if (amount <= 0)
      return interaction.reply({ content: "❌ رقم غلط", ephemeral: true });

    await createUser(target.id);
    let user = await getUser(target.id);

    user[type] += amount;

    await updateUser(target.id, user);

    return interaction.reply(`✅ تم إضافة ${amount} ${type} لـ ${target.username}`);
  },
};
