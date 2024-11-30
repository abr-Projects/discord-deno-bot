import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";

createCommand({
  name: "week",
  description: "Start the week",
  type: ApplicationCommandTypes.ChatInput,
  execute: async (Bot, interaction) => {
    const guildId = interaction.guildId;
    const userTag = interaction.user.username;

    if (!guildId) {
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "This command can only be used in a server.",
        },
      });
      return;
    }

    if (!userTag) {
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "Unable to retrieve your Discord tag.",
        },
      });
      return;
    }

    try {
      // Acknowledge the interaction early to prevent expiration
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.DeferredChannelMessageWithSource,
      });

      // Fetch all channels in the guild
      const channels = await Bot.helpers.getChannels(guildId);
      
      // Check for an existing category with the same name as the user's Discord tag
      const existingCategory = Array.from(channels.values()).find(
        (channel) => channel.type === 4 && channel.name === userTag
      );

      if (existingCategory) {
        console.log(`Found existing category: ${existingCategory.id}. Deleting it...`);
        // Delete the existing category and its child channels
        const childChannels = Array.from(channels.values()).filter(
          (channel) => channel.parentId === existingCategory.id
        );
        for (const child of childChannels) {
          await Bot.helpers.deleteChannel(child.id);
        }
        await Bot.helpers.deleteChannel(existingCategory.id);
      }

      // Create a new category with the user's Discord tag as the name
      const newCategory = await Bot.helpers.createChannel(guildId, {
        name: userTag, // Use the user's Discord tag as the category name
        type: 4, // Type 4 for category
      });

      console.log("Created new category ID:", newCategory.id);

      // Channel names for the week
      const daysOfWeek = ["goals", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

      // Create each channel and assign them to the category
      for (const day of daysOfWeek) {
        console.log(`Creating channel for: ${day}`);
        await Bot.helpers.createChannel(guildId, {
          name: day,
          type: 0, // Type 0 for text channels
          parentId: newCategory.id, // Assign to the new category
        });
      }

      // Edit the original interaction response to confirm success
      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: `✅ Successfully started the week. A new category has been created with the channels.`,
      });
    } catch (error) {
      console.error("Error in creating the week structure:", error);
      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: "❌ An error occurred while starting the week. Please try again later.",
      });
    }
  },
});
