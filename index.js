const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the RAG bot a question")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("Your question")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Submit feedback")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Your feedback")
        .setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
rest
  .put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  )
  .then(() => console.log("✅ Commands registered"))
  .catch(console.error);

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ask") {
    const question = interaction.options.getString("question")?.trim();

    if (!question) {
      await interaction.reply({
        content: "❌ Please ask a valid question.",
        flags: 64,
      });
      return;
    }

    await interaction.deferReply();

    await new Promise((res) => setTimeout(res, 1500));

    const embed = new EmbedBuilder()
      .setTitle("🤖 RAG Bot Answer")
      .setDescription(`🧠 **Answer:** "${question}"`)
      .setColor("#00ff00")
      .setFooter({ text: "React with 👍/👎 for feedback • Powered by Mock AI" })
      .setTimestamp();

    const sentMessage = await interaction.editReply({ embeds: [embed] });

    await sentMessage.react("👍").catch(() => {});
    await sentMessage.react("👎").catch(() => {});
  }

  if (commandName === "feedback") {
    const feedback = interaction.options.getString("message");

    await interaction.reply({
      content: "✅ Submitting feedback...",
      flags: 64,
    });

    const embed = new EmbedBuilder()
      .setTitle("✅ Feedback Received")
      .setDescription(`Thank you for your feedback: "${feedback}"`)
      .setColor("#00ff00")
      .setFooter({ text: "Your feedback helps improve the bot!" })
      .setTimestamp();

    await interaction.followUp({ embeds: [embed], flags: 64 });

    console.log(`📝 Feedback from ${interaction.user.tag}: "${feedback}"`);
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.partial) await reaction.fetch().catch(() => {});
  if (user.bot || reaction.message.author?.id !== client.user.id) return;

  const emoji = reaction.emoji.name;
  if (emoji === "👍" || emoji === "👎") {
    const type = emoji === "👍" ? "positive" : "negative";
    console.log(
      `🧾 ${type} feedback from ${user.tag} on message ${reaction.message.id}`
    );
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const question = message.content.replace(`<@${client.user.id}>`, "").trim();
  if (!question) {
    await message.reply("👋 Use `/ask` to ask me something!");
    return;
  }

  await message.channel.sendTyping();
  await new Promise((res) => setTimeout(res, 1500));

  const embed = new EmbedBuilder()
    .setTitle("🤖 RAG Bot Answer")
    .setDescription(`🧠 **Answer:** "${question}"`)
    .setColor("#00ff00")
    .setFooter({ text: "React with 👍/👎 for feedback • Powered by Mock AI" })
    .setTimestamp();

  const sentMessage = await message.reply({ embeds: [embed] });
  await sentMessage.react("👍").catch(() => {});
  await sentMessage.react("👎").catch(() => {});
});

client.login(process.env.BOT_TOKEN);
