const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("عرض الشنطة"),

  async execute(interaction) {
    const user = interaction.user;

    const res = await pool.query(
      `SELECT * FROM inventory WHERE user_id = $1`,
      [user.id]
    );

    if (res.rows.length === 0) {
      return interaction.reply("🎒 الشنطة فاضية");
    }

    let text = "🎒 الشنطة:\n\n";

    for (const item of res.rows) {
      text += `📦 ${item.item_name} x${item.quantity}\n`;
    }

    await interaction.reply(text);
  },
};
