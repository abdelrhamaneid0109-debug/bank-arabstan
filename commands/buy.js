const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("شراء منتج")
    .addIntegerOption(option =>
      option.setName("product_id").setDescription("ID المنتج").setRequired(true)
    ),

  async execute(interaction) {
    const buyer = interaction.user;
    const productId = interaction.options.getInteger("product_id");

    // 📦 هات المنتج
    const res = await pool.query(
      `SELECT * FROM products WHERE id = $1`,
      [productId]
    );

    const product = res.rows[0];

    if (!product) {
      return interaction.reply({
        content: "❌ المنتج مش موجود",
        ephemeral: true
      });
    }

    if (product.seller_id === buyer.id) {
      return interaction.reply({
        content: "❌ مينفعش تشتري من نفسك",
        ephemeral: true
      });
    }

    // 🧾 إنشاء فاتورة
    const invoiceRes = await pool.query(
      `INSERT INTO invoices (seller_id, buyer_id, item_name, price, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        product.seller_id,
        buyer.id,
        product.name,
        product.price,
        product.currency
      ]
    );

    const invoiceId = invoiceRes.rows[0].id;

    await interaction.reply(`
🧾 فاتورة شراء

📦 المنتج: ${product.name}
💰 السعر: ${product.price} ${product.currency}

🆔 رقم الفاتورة: ${invoiceId}

✔️ /confirm id:${invoiceId}
❌ /cancel id:${invoiceId}
`);
  },
};
