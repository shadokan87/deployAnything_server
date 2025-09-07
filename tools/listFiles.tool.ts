import { tool } from "@fragola-ai/agentic";

export const listFilesTool = tool({
    name: "list_files",
    description: "returns a list containing every file paths in the project with its corresponding id",
    handler: "dynamic"
});