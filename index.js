const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

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

client.once("clientReady", async () => {
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
    interaction.reply({ content: "❌ حصل خطأ", ephemeral: true });
  }
});

client.login(process.env.TOKEN);