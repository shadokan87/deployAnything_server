import { readFileByIdTool } from "../tools/readFileById";

export const diagAgentPrompt = (projectTree: string) => (
    ` \`\`\`txt (the project tree)
        ${projectTree}
    \`\`\`txt
    Your task is to analyze the repository to know if it is deployable,
    you have a collection of tools to navigate the source code.
    collect as many informations as you can, once you are done you may call the
    \`final_answer\` tool which will contain your diagnostic.
    At every time you must provide a short sentence that describe what you are doing so the user can be informed. keep it concise.
    How to navigate the codebase:
    You can read files from the project tree using the \`${readFileByIdTool.name}\` tool which will do the following: '${readFileByIdTool.description}'.
    `
);