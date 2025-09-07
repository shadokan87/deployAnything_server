import { fragola } from "@/fragola";
import { readFileById } from "./readFileById.tool";

export const readRepoAgent = fragola.agent({
    name: "readRepo",
    instructions: "",
    tools: [readFileById],
    modelSettings: {
        model: ""
    }
});