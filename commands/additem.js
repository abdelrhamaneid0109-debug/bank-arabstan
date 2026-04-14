const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const shopChannels = {
  "1492285970056220792": "weapons",
  "1492285765252681809": "clothes",
  "1492285853823668254": "herbs",
  "1492286176097206313": "books",
  "1492285901190070373": "sweets",
  "1492285702543638679": "horses"
};

const currencyNames = {
  copper: "نحاس",
  silver: "فضة",
  gold: "ذهب"
};

const categoryNames = {
  weapons: "أسلحة",
  clothes: "ملابس",
  herbs: "أعشاب",
  books: "كتب",
  sweets: "حلويات",
  horses: "خيول"
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("اضافة_منتج")
    .setDescription("إضافة منتج جديد")
    
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
          { name: "ذهب", value: "gold" }
        )
    )

    // 📎 صورة مرفوعة
    .addAttachmentOption(option =>
      option.setName("image")
        .setDescription("صورة المنتج")
        .setRequired(false)
    )

    // 🔗 رابط صورة
    .addStringOption(option =>
      option.setName("image_url")
        .setDescription("رابط صورة المنتج")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) return;

      const allowedRoles = [
        "1491578362743750776",
        "1491565491070963733",
        "1491565646687895563"
      ];

      const hasRole = interaction.member.roles.cache.some(role =>
        allowedRoles.includes(role.id)
      );

      if (!hasRole) {
        return interaction.reply({
          content: "❌ هذا الأمر للتجار فقط",
          ephemeral: true
        });
      }

      const category = shopChannels[interaction.channel.id];

      if (!category) {
        return interaction.reply({
          content: "❌ استخدم الأمر داخل قناة متجر",
          ephemeral: true
        });
      }

      const name = interaction.options.getString("name");
      const price = interaction.options.getInteger("price");
      const currency = interaction.options.getString("currency");

      const attachment = interaction.options.getAttachment("image");
      const imageUrlInput = interaction.options.getString("image_url");

      // 🎯 تحديد الصورة
      let imageUrl = null;

      if (attachment) {
        imageUrl = attachment.url;
      } else if (imageUrlInput) {
        imageUrl = imageUrlInput;
      }

      if (price <= 0) {
        return interaction.reply({
          content: "❌ السعر لازم يكون أكبر من 0",
          ephemeral: true
        });
      }

      if (name.length > 50) {
        return interaction.reply({
          content: "❌ اسم المنتج طويل جدًا",
          ephemeral: true
        });
      }

      // 1️⃣ إدخال المنتج
      const result = await pool.query(
        `INSERT INTO products (name, price, currency, category, seller_id, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [name, price, currency, category, interaction.user.id, imageUrl]
      );

      const productId = result.rows[0].id;

      // 2️⃣ Embed
      const embed = new EmbedBuilder()
        .setTitle("🛒 منتج جديد")
        .setColor("#00b894")
        .addFields(
          { name: "📦 المنتج", value: `**${name}**` },
          { name: "💰 السعر", value: `**${price} ${currencyNames[currency]}**` },
          { name: "🏪 التصنيف", value: `**${categoryNames[category]}**` },
          { name: "🆔 ID", value: `\`${productId}\`` }
        )
        .setFooter({ text: "استخدم /buy للشراء" })
        .setTimestamp();

      // 🖼️ إضافة الصورة لو موجودة
      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      // 3️⃣ إرسال
      const msg = await interaction.channel.send({
        embeds: [embed]
      });

      // 4️⃣ تحديث DB
      await pool.query(
        `UPDATE products
         SET message_id = $1, channel_id = $2
         WHERE id = $3`,
        [msg.id, msg.channel.id, productId]
      );

      await interaction.reply({
        content: "✅ تم إضافة المنتج مع الصورة",
        ephemeral: true
      });

    } catch (error) {
      console.error(error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ حصل خطأ",
          ephemeral: true
        });
      }
    }
  },
};
