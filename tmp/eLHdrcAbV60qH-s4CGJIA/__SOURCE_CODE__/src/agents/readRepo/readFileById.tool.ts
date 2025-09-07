import { tool } from "@fragola-ai/agentic";
import {z} from "zod";

export const readFileById = tool({
    name: "readFileById",
    description: "return the content of a file in the project. provide the id of the file",
    schema: z.object({
        id: z.string().describe("the id of the file to read")
    }),
    handler: async (params) => {

    }

})