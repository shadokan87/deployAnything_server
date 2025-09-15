// Minimal Express server using Bun runtime
import express from "express";
import cors from "cors";
import { functionToSandbox } from "./lib";
import { nanoid } from "nanoid";
import { $ } from "bun";
import { validateQueryParams } from "./middleware/zodValidate";
import { repoDiagnosticSchema } from "./schemas/repoDiagnostic";
import { TreeService, type TreeResult } from "./services/treeService";
import { tool, type Tool } from "@fragola-ai/agentic";
import { skip } from "@fragola-ai/agentic/event";
import { fragola } from "./fragola";
import z from "zod";
import { listFilesTool } from "./tools/listFiles.tool";
import { readFileByIdTool } from "./tools/readFileById";
import { diagAgentPrompt } from "./prompts/diagAgent.prompt";
import { AgentContext, type AgentState } from "@fragola-ai/agentic/agent";
import { success } from "zod/v4";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS for all origins
app.use(cors());

app.use(express.json()).get("/health", (_req, res) => {
    res.status(200).send("ok");
}).get("/", (_req, res) => {
    res.send("Deploy Anything server live.");
});

/**
 * Schema representing the diagnostic state of a repository.
 *
 * @property success - Indicates whether the diagnostic was successful.
 * @property missingConfig - Indicates if the repository is missing configuration.
 * @property missingScripts - Describes the state of missing scripts. If `missing` is false, no scripts are missing.
 *   If `missing` is true, provides details about what is missing and an explanation.
 */
export const repoDiagnosticStateSchema = z.object({
    success: z.boolean().describe("Indicates whether the diagnostic was successful."),
    projectSummary: z.string().describe("A summary of what the project about"),
    missingConfig: z.boolean().describe("Indicates if the repository is missing configuration."),
    // securityIssue: z.string().describe("security issue found"),
    missingScripts: z.union([
        z.object({
            missing: z.literal(false).describe("No scripts are missing.")
        }),
        z.object({
            missing: z.literal(true).describe("Scripts are missing."),
            what: z.string().describe("1 keyword of what is missing e.g 'install', 'build' and so on"),
            explaination: z.string().describe("Provides an explanation for the missing scripts.")
        })
    ]).describe("Describes the state of missing scripts. If `missing` is false, no scripts are missing. If `missing` is true, provides details about what is missing and an explanation.")
});

type RepoDiagnosticState = {
    complete?: boolean,
    success: boolean,
    agentState: AgentState | undefined
} & z.infer<typeof repoDiagnosticStateSchema>;

app.get("/api/repoDiagnostic", validateQueryParams(repoDiagnosticSchema), async (req, res) => {
    const requestId = nanoid();

    let state: RepoDiagnosticState = {
        success: false,
        missingConfig: false,
        missingScripts: {
            missing: false
        },
        agentState: undefined
    }
    const updateState = (data: RepoDiagnosticState, close: boolean = false) => {
        if (data.complete || state.complete) {
            !res.writableEnded && res.end();
            return ;
        } 
        state = data;
        if (close)
            state["complete"] = true;
        res.write(`data: ${JSON.stringify(state)}\n\n`);
        if (typeof (res as any).flush === "function") {
            (res as any).flush();
        }
        if (close === true) {
            !res.writableEnded && res.end();
            res.json({ success: true })
        }
    };

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    res.flushHeaders();

    const cloneRepo = async (url: string, requestId: string) => {
        console.log("cloning: ", url, requestId);
        const path = `./tmp/${requestId}`;
        // Convert GitHub repo URL to tarball URL
        const tarballUrl = url.replace(/\.git$/, "") + "/archive/refs/heads/main.tar.gz";
        const response = await fetch(tarballUrl);
        if (!response.ok) throw new Error(`Failed to fetch repo: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();

        // Ensure the target directory exists
        await $`mkdir -p ${path}`;

        const tarballPath = `${path}/repo.tar.gz`;
        await Bun.write(tarballPath, new Uint8Array(arrayBuffer));

        // Extract the tarball to a temporary location first
        const extract = Bun.spawn({
            cmd: ["tar", "-xzf", tarballPath, "-C", path],
            stdout: "inherit",
            stderr: "inherit"
        });
        await extract.exited;
        if (extract.exitCode !== 0)
            return { success: false, data: "extract_fail" };

        // Find the extracted folder (usually repo-name-main) and rename to __SOURCE_CODE__
        const files = await $`ls ${path}`.text();
        const extractedFolder = files.trim().split('\n').find(f => f !== 'repo.tar.gz');
        if (extractedFolder) {
            await $`mv ${path}/${extractedFolder} ${path}/__SOURCE_CODE__`;
        }
        return { success: true, data: path }
    };
    try {
        const { url } = req.query as {url: string};
        const response = await cloneRepo(url, requestId);
        const withSourceCode = (path: string) => `${path}/__SOURCE_CODE__`;
        if (response.success) {
            console.log("#br1");
            type IdToPath = Map<TreeResult["custom"]["id"], string>;
            const idToPath: IdToPath = new Map();

            const tree = new TreeService(withSourceCode(response.data), withSourceCode(response.data), (id, path) => {
                idToPath.set(id, path);
            });
            console.log("#br2");
            const tools: Tool<any>[] = [readFileByIdTool, tool({ name: "final_answer", description: "give your final diagnostic", handler: "dynamic", schema: repoDiagnosticStateSchema })];
            const diagAgent = fragola.agent({
                name: "github repository diagnostic",
                // instructions: "You are a helful assistant",
                instructions: diagAgentPrompt(JSON.stringify(await tree.list())),
                tools,
                modelSettings: {
                    model: "blackboxai/anthropic/claude-opus-4",
                    tool_choice: "auto",
                    stream: true
                },
                stepOptions: {
                    maxStep: 999
                }
            });

            diagAgent.onToolCall(async (params, tool, ctx) => {
                switch (tool.name) {
                    case readFileByIdTool.name: {
                        return (async () => {
                            const path = idToPath.get(params.id);
                            if (!path)
                                return `No file with id ${params.id} seem exist.`;

                            try {
                                const file = Bun.file(path);
                                const textFile = await file.text();
                                return textFile;
                            } catch (error) {
                                return `The file with id ${params.id} exists but failed to open: ${error}`;
                            }
                        })();
                    } case "final_answer": {
                        await ctx.stop();
                        updateState({ ...state, ...params, agentState: ctx.state }, true);
                        diagAgent.raw((_, ctx) => {
                            return { ...ctx.state, conversationstepCount: 0, conversation: [], status: "idle" }
                        });
                        break ;
                        // return "success";
                    }
                    default: {
                        return skip();
                    }
                }
            });

            diagAgent.onModelInvocation(async (callApi, ctx) => {
                if (ctx.state.stepCount > 100)
                    return await callApi(undefined, { ...ctx.options.modelSettings, tool_choice: "final_answer" as any });
                else
                    return skip();
            });

            diagAgent.onAfterStateUpdate(async (ctx) => {
                updateState({ ...state, agentState: ctx.state }, false);
                console.log("agent state: ", JSON.stringify(ctx.state, null, 2));
            });
            if (!diagAgent.getState().conversation.length)
                void await diagAgent.userMessage({ content: "check this project for deployability" });
            else {
                updateState(state, true);
            }
        } else
            updateState({ ...state, success: false }, true);
    } catch (e) {
        console.error("err", e);
        updateState({ ...state, success: false }, true);
    }
});

app.listen(PORT, async () => {
    // const checkGitthubRepo = functionToSandbox((url: string, requestId: string) => {
    //     // console.log("here");
    //     // cloneRepo(url, `tmp/${requestId}`);
    //     // console.log("here 2");

    //     // console.log(process.env);
    // });

    // checkGitthubRepo.sandboxed("https://github.com/shadokan87/Deploy-Anything", requestId);
});