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
    .setName("اضافة_منتج")
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
      return interaction.reply({
        content: "❌ للتجار فقط",
        ephemeral: true
      });
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

    if (price <= 0) {
      return interaction.reply({
        content: "❌ السعر لازم يكون أكبر من 0",
        ephemeral: true
      });
    }

    // 1️⃣ إنشاء المنتج
    const result = await pool.query(
      `INSERT INTO products (name, price, currency, category, seller_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, price, currency, category, interaction.user.id]
    );

    const productId = result.rows[0].id;

    // 2️⃣ إرسال رسالة المنتج في نفس القناة
    const msg = await interaction.channel.send(`
🛒 **منتج جديد**

📦 ${name}
💰 ${price} ${currency}
🏪 ${category}

🆔 ID: ${productId}

🧾 للشراء:
/buy product_id:${productId}
`);

    // 3️⃣ حفظ message_id + channel_id
    await pool.query(
      `UPDATE products
       SET message_id = $1, channel_id = $2
       WHERE id = $3`,
      [msg.id, msg.channel.id, productId]
    );

    // 4️⃣ رد خاص للتاجر
    await interaction.reply({
      content: "✅ تم إضافة المنتج بنجاح",
      ephemeral: true
    });
  },
};
