const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { createUser, getUser, updateUser } = require("../database/db");

const cooldownTime = 60 * 60 * 1000; // ساعة

module.exports = {
  data: new SlashCommandBuilder()
    .setName("راتب")
    .setDescription("استلام راتب"),

  async execute(interaction) {
    const id = interaction.user.id;

    await createUser(id);
    let user = await getUser(id);

    const now = Date.now();
    const lastSalary = Number(user.last_salary) || 0;

    if (lastSalary && now - lastSalary < cooldownTime) {
      const remaining = cooldownTime - (now - lastSalary);
      const minutes = Math.ceil(remaining / 60000);
      return interaction.reply({
        content: `⏳ استنى **${minutes} دقيقة** الأول`,
        flags: MessageFlags.Ephemeral
      });
    }

    const amount = Math.floor(Math.random() * 50) + 10;
    user.copper += amount;
    user.last_salary = now;

    await updateUser(id, user);

    return interaction.reply(`💼 خدت ${amount} نحاس 🟤`);
  },
};
