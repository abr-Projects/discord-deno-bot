import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts";
import { dotEnvConfig } from "../../deps.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
createCommand({
  name: "english",
  description: "Add a new English word to the database.",
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
      required: false,
    },
    {
      name: "example",
      description: "An example sentence using the word",
      type: 3, // STRING type
      required: false,
    },
  ],
  execute: async (Bot, interaction) => {
    const word = interaction.data?.options?.find((option) => option.name === "word")?.value;
    let definition = interaction.data?.options?.find((option) => option.name === "definition")?.value;
    let example = interaction.data?.options?.find((option) => option.name === "example")?.value;
    const env = dotEnvConfig({ export: true });

    if (!word) {    
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

      axiod.post("https://api.groq.com/openai/v1/chat/completions", 
        {
            "model": "llama3-8b-8192",
            "messages": [
              {"role":"system", "content": " A word or phrase will be given and you will return json {'definition': 'definition', 'example': 'example'}"},
              {"role": "user", "content": word},
              
            ],
            "response_format": { type: 'json_object' }
        }
        ,{
            headers: {
                "Authorization": `Bearer ${env.groq_token}`,
                "Content-Type": "application/json"
              }
             
        }).then(
           async (res) => {
                const dict_obj = JSON.parse(res.data.choices[0].message.content);
                definition = dict_obj['definition'];
                example = dict_obj['example'];
                
                console.log(definition,example)

                await Bot.helpers.editInteractionResponse(interaction.token, {
                    content: `✅ Added The word to the database\n**Word**: __${word}__\n**Definition**: __${definition}__\n**Example**: __${example}__`,
                });
            }
        )

      
    } catch (error) {
      console.error("Error inserting word into database:", error);

      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: "❌ There was an error adding the word to the database. Please try again later.",
      });
    }
  },
});
