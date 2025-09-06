// Minimal Express server using Bun runtime
import express from "express";
import { functionToSandbox } from "./lib";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json()).get("/health", (_req, res) => {
    res.status(200).send("ok");
}).get("/", (_req, res) => {
    res.send("Deploy Anything server live.");
});

app.listen(PORT, () => {
    const checkGitthubRepo = functionToSandbox((url: string) => {
        console.log("cloning: ", url);
    });

    checkGitthubRepo.sandboxed("https://github.com/shadokan87/Deploy-Anything")

    // const runFn = vm.run(code);
    // runFn("haha");
    // console.log(`🚀 Server listening on http://localhost:${PORT}`);
});