const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invoice")
    .setDescription("إنشاء فاتورة بيع")
    .addUserOption(option =>
      option.setName("user").setDescription("المشتري").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("item").setDescription("اسم المنتج").setRequired(true)
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

    // ✅ هنا الصح
    const allowedRoles = [
      "ROLE_ID_1",
      "ROLE_ID_2",
      "ROLE_ID_3"
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

    // باقي الكود 👇
    const seller = interaction.user;
    const buyer = interaction.options.getUser("user");
    const item = interaction.options.getString("item");
    const price = interaction.options.getInteger("price");
    const currency = interaction.options.getString("currency");

    if (buyer.id === seller.id) {
      return interaction.reply({ content: "❌ مينفعش تبيع لنفسك", ephemeral: true });
    }

    if (price <= 0) {
      return interaction.reply({ content: "❌ السعر لازم يكون أكبر من 0", ephemeral: true });
    }

    const result = await pool.query(
      `INSERT INTO invoices (seller_id, buyer_id, item_name, price, currency)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [seller.id, buyer.id, item, price, currency]
    );

    const id = result.rows[0].id;

    await interaction.reply(`
🧾 فاتورة جديدة

👤 المشتري: <@${buyer.id}>
🧑‍💼 التاجر: <@${seller.id}>
📦 المنتج: ${item}
💰 السعر: ${price} ${currency}

🆔 رقم الفاتورة: ${id}

✔️ استخدم /confirm id:${id}
❌ أو /cancel id:${id}
`);
  },
};
