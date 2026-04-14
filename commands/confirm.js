const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");
const { getUser, updateUser, createUser } = require("../database/db");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("تاكيد_الشراء")
    .setDescription("تأكيد عملية الشراء")
    .addIntegerOption(option =>
      option.setName("id").setDescription("رقم الفاتورة").setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.user;
    const id = interaction.options.getInteger("id");

    // 🧾 جلب الفاتورة
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

    if (invoice.buyer_id !== user.id) {
      return interaction.reply({ content: "❌ مش مسموح لك تأكد الفاتورة دي", ephemeral: true });
    }

    // 👤 تأكد إن المستخدمين موجودين
    await createUser(invoice.buyer_id);
    await createUser(invoice.seller_id);

    const buyer = await getUser(invoice.buyer_id);
    const seller = await getUser(invoice.seller_id);

    const currency = invoice.currency;
    const price = invoice.price;

    // ⚠️ تأمين القيم
    if (!buyer[currency]) buyer[currency] = 0;
    if (!seller[currency]) seller[currency] = 0;

    // 💰 تحقق من الفلوس
    if (buyer[currency] < price) {
      return interaction.reply({ content: "❌ معندكش فلوس كفاية", ephemeral: true });
    }

    // 🚀 Transaction
    await pool.query("BEGIN");

    try {
      // خصم
      buyer[currency] -= price;

      // إضافة
      seller[currency] += price;

      await updateUser(invoice.buyer_id, buyer);
      await updateUser(invoice.seller_id, seller);

      // قفل الفاتورة
      await pool.query(
        `UPDATE invoices SET status = 'completed' WHERE id = $1`,
        [id]
      );

      // 🎒 إضافة المنتج
      await pool.query(
        `INSERT INTO inventory (user_id, item_name, quantity)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_id, item_name)
         DO UPDATE SET quantity = inventory.quantity + 1`,
        [invoice.buyer_id, invoice.item_name]
      );

      // 🧾 تسجيل اللوج
      await pool.query(
        `INSERT INTO logs (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          user.id,
          "confirm",
          `اشترى ${invoice.item_name} بـ ${invoice.price} ${invoice.currency}`
        ]
      );

      await pool.query("COMMIT");

    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(err);
      return interaction.reply({ content: "❌ حصل خطأ أثناء العملية", ephemeral: true });
    }

    // ✅ رد البوت
    await interaction.reply(`
✅ تم الشراء بنجاح!

📦 المنتج: ${invoice.item_name}
💰 السعر: ${price} ${currency}
🧑‍💼 التاجر: <@${invoice.seller_id}>
`);
  },
};
