const { Client, GatewayIntentBits, Collection, MessageFlags } = require("discord.js");
const fs = require("fs");
const { Pool } = require("pg");
const path = require("path");

// ---------------------------------------------------------------------------
// Run database migrations before the bot starts.
// To run migrations manually: npm run migrate
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// تحميل الأوامر
const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = client.commands.map(cmd => cmd.data);
  await client.application.commands.set(commands);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply({ content: "❌ حصل خطأ", flags: MessageFlags.Ephemeral });
  }
});

runMigrations()
  .then(() => {
    client.login(process.env.TOKEN);
  })
  .catch((err) => {
    console.error("❌ Fatal: could not run migrations, aborting startup.", err);
    process.exit(1);
  });