import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts";

createCommand({
  name: "chinese",
  description: "Add a new Chinese word to the database.",
  type: ApplicationCommandTypes.ChatInput,
  options: [
    {
      name: "word",
      description: "The word to add",
      type: 3, // STRING type
      required: true,
    },
    {
      name: "definition",
      description: "The definition of the word",
      type: 3, // STRING type
      required: true,
    },
    {
      name: "example",
      description: "An example sentence using the word",
      type: 3, // STRING type
      required: true,
    },
  ],
  execute: async (Bot, interaction) => {
    const word = interaction.data?.options?.find((option) => option.name === "word")?.value;
    const definition = interaction.data?.options?.find((option) => option.name === "definition")?.value;
    const example = interaction.data?.options?.find((option) => option.name === "example")?.value;

    if (!word || !definition || !example) {
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "The word parameter is required.",
        },
      });
      return;
    }

    try {
      // Acknowledge the interaction early to prevent expiration
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.DeferredChannelMessageWithSource,
      });

      const dbClient = await getDbClient();

      // Insert the data into the database
      await dbClient.queryObject(
        `
        INSERT INTO chinese (word, definition, example)
        VALUES ($1, $2, $3)
        `,
        [word, definition, example]
      );

      dbClient.release();

      // Respond with a success message
      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: `✅ The word "${word}" has been successfully added to the database!`,
      });
    } catch (error) {
      console.error("Error inserting word into database:", error);

      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: "❌ There was an error adding the word to the database. Please try again later.",
      });
    }
  },
});
