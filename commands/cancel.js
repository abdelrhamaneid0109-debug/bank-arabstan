const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("الغاء_الفاتورة")
    .setDescription("إلغاء الفاتورة")
    .addIntegerOption(option =>
      option.setName("id").setDescription("رقم الفاتورة").setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.user;
    const id = interaction.options.getInteger("id");

    // هات الفاتورة
    const res = await pool.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [id]
    );

    const invoice = res.rows[0];

    if (!invoice) {
      return interaction.reply({ content: "❌ الفاتورة مش موجودة", ephemeral: true });
    }

    if (invoice.status !== "pending") {
      return interaction.reply({ content: "❌ الفاتورة دي اتقفلت بالفعل", ephemeral: true });
    }

    // السماح للمشتري أو التاجر فقط
    if (invoice.buyer_id !== user.id && invoice.seller_id !== user.id) {
      return interaction.reply({
        content: "❌ مش مسموح لك تلغي الفاتورة دي",
        ephemeral: true
      });
    }

    // إلغاء الفاتورة
    await pool.query(
      `UPDATE invoices SET status = 'cancelled' WHERE id = $1`,
      [id]
    );
// ✅ تسجيل اللوج
await pool.query(
  `INSERT INTO logs (user_id, action, details)
   VALUES ($1, $2, $3)`,
  [
    user.id,
    "cancel",
    `ألغى فاتورة ${invoice.item_name} بـ ${invoice.price} ${invoice.currency}`
  ]
);
    await interaction.reply(`
❌ تم إلغاء الفاتورة

📦 المنتج: ${invoice.item_name}
💰 السعر: ${invoice.price} ${invoice.currency}
`);
  },
};
