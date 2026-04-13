const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("additem")
    .setDescription("إضافة منتج في المتجر")
    .addStringOption(option =>
      option.setName("name").setDescription("اسم المنتج").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("price").setDescription("السعر").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("currency")
        .setDescription("نوع العملة")
        .setRequired(true)
        .addChoices(
          { name: "نحاس", value: "copper" },
          { name: "فضة", value: "silver" },
          { name: "دهب", value: "gold" }
        )
    ),

  async execute(interaction) {

    // 🔐 تحقق من رول التاجر
    const allowedRoles = [
      "ROLE_ID_1",
      "ROLE_ID_2"
    ];

    const hasRole = interaction.member.roles.cache.some(role =>
      allowedRoles.includes(role.id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ الأمر ده للتجار فقط",
        ephemeral: true
      });
    }

    const name = interaction.options.getString("name");
    const price = interaction.options.getInteger("price");
    const currency = interaction.options.getString("currency");

    if (price <= 0) {
      return interaction.reply({
        content: "❌ السعر لازم يكون أكبر من 0",
        ephemeral: true
      });
    }

    // 🛒 إرسال المنتج في الشات
    await interaction.reply(`
🛒 **منتج جديد**

📦 **${name}**
💰 **${price} ${currency}**

🧾 للشراء:
استخدم:
\`/invoice user:@التاجر item:${name} price:${price} currency:${currency}\`
`);
  },
};
