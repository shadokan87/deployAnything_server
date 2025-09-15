import { streamText } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import cv from "../../../../public/cv.json"

const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("!cv", JSON.stringify(cv, null, 2));
  return streamText({
    model: azure("gpt-4.1-mini"),
    system: `# Context
    You are a chatbot on a software engineer personnal website, your task is to act as a knowledge base and asnwer with the knowledge given to you in this system propmpt.
    You may not:
      - answer off topic questions such as: what is the weather today, write me a hello world program in C, etc.
      - answer non professionnal questions which I did not provide you explicitly
    You may extend a bit the answers with knowledge you know, for example if someone asks where I studied, don't hesitate to also explain what my school is
    If you do not have the knowledge to asnwer a question, you will reply with: I'm sorry I don't have the knowledge required to <whatever they asked>.
    # Knowledge you can use to answer
    <my cv>
      ${JSON.stringify(cv, null, 2)}
    <my cv/>
    # Response format
    You will generate the respones using markdown syntax
    `,
    messages,
  }).toDataStreamResponse();
}