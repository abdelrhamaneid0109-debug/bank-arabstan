const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🏪 ربط القنوات بالتصنيفات
const shopChannels = {
  "1492285970056220792": "weapons",
  "1492285765252681809": "clothes",
  "1492285853823668254": "herbs",
  "1492286176097206313": "books",
  "1492285901190070373": "sweets",
  "1492285702543638679": "horses"
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("additem")
    .setDescription("إضافة منتج")
    .addStringOption(option =>
      option.setName("name").setDescription("اسم المنتج").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("price").setDescription("السعر").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("currency")
        .setDescription("العملة")
        .setRequired(true)
        .addChoices(
          { name: "نحاس", value: "copper" },
          { name: "فضة", value: "silver" },
          { name: "دهب", value: "gold" }
        )
    ),

  async execute(interaction) {

    // 🔐 تحقق من التاجر
    const allowedRoles = ["ROLE_ID_1", "ROLE_ID_2", "ROLE_ID_3"];

    const hasRole = interaction.member.roles.cache.some(role =>
      allowedRoles.includes(role.id)
    );

    if (!hasRole) {
      return interaction.reply({ content: "❌ للتجار فقط", ephemeral: true });
    }

    // 📍 تحقق من القناة
    const category = shopChannels[interaction.channel.id];

    if (!category) {
      return interaction.reply({
        content: "❌ لازم تستخدم الأمر داخل قناة متجر",
        ephemeral: true
      });
    }

    const name = interaction.options.getString("name");
    const price = interaction.options.getInteger("price");
    const currency = interaction.options.getString("currency");

    // 💾 تخزين المنتج
    await pool.query(
      `INSERT INTO products (name, price, currency, category)
       VALUES ($1, $2, $3, $4)`,
      [name, price, currency, category]
    );

    // 🛒 عرض المنتج
    await interaction.reply(`
🛒 **منتج جديد**

📦 ${name}
💰 ${price} ${currency}
🏪 ${category}

🧾 للشراء:
/invoice user:@التاجر item:${name} price:${price} currency:${currency}
`);
  },
};
