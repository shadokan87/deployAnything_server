import { readFileByIdTool } from "../tools/readFileById";

// export const diagAgentPrompt = (projectTree: string) => (`Call final_answer directly with positive result for testing purposes`);
export const diagAgentPrompt = (projectTree: string) => (
    ` \`\`\`txt (the project tree)
        ${projectTree}
    \`\`\`txt
    Your task is to analyze the repository to know if it is deployable,
    you have a collection of tools to navigate the source code.
    collect as many informations as you can, once you are done you may call the
    \`final_answer\` tool which will contain your diagnostic.
    Remembember: At every time even if you use tools, you must provide a sentence in the content field, it should be a short sentence to describe to the user what you are doing, you are not allowed not to communicate what you are doing.
    CIRITAL: you must in every case finish your generation with the \`final_answer\` tool.
    How to navigate the codebase:
    You can read files from the project tree using the \`${readFileByIdTool.name}\` tool which will do the following: '${readFileByIdTool.description}'.
    `
);