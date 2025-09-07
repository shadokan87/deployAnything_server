import { z } from "zod";
import { tool } from "@fragola-ai/agentic";

export const readFileByIdSchema = z.object({
    id: z.string().describe("The id of the file to inspect. returns the content of the file")
});

export const readFileByIdTool = tool({
    name: "read_file_by_id",
    description: "Use this tool to get the content of a file in the project",
    handler: "dynamic",
    schema: readFileByIdSchema
});