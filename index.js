const { Client, GatewayIntentBits, Collection, MessageFlags } = require("discord.js");
const fs = require("fs");
const { Pool } = require("pg");
const path = require("path");

// ---------------------------------------------------------------------------
// Run database migrations before the bot starts.
// ---------------------------------------------------------------------------
async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const migrationsDir = path.join(__dirname, "database", "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`▶ Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✅ Migration complete: ${file}`);
    }

    console.log("✅ All migrations applied.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Discord Bot Setup
// ---------------------------------------------------------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// تحميل الأوامر
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  }
}

// ---------------------------------------------------------------------------
// عند تشغيل البوت
// ---------------------------------------------------------------------------
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = client.commands.map(cmd => cmd.data);

  const GUILD_ID = "1490837785786056787";

  try {
    // 🧹 مسح الأوامر القديمة (تشغلها مرة واحدة بس)
    await client.application.commands.set([]);

    // ✅ تسجيل أوامر السيرفر
    await client.guilds.cache.get(GUILD_ID).commands.set(commands);

    console.log("✅ Commands cleaned & registered");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
});

// ---------------------------------------------------------------------------
// استقبال الأوامر
// ---------------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply({
      content: "❌ حصل خطأ",
      flags: MessageFlags.Ephemeral
    });
  }
});

// ---------------------------------------------------------------------------
// تشغيل البوت
// ---------------------------------------------------------------------------
runMigrations()
  .then(() => {
    client.login(process.env.TOKEN);
  })
  .catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  });
