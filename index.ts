// Minimal Express server using Bun runtime
import express from "express";
import { functionToSandbox } from "./lib";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Basic middleware
app.use(express.json());

// Health check route
app.get("/health", (_req, res) => {
    res.status(200).send("ok");
});

// Root route
app.get("/", (_req, res) => {
    res.send("Hello from Express + Bun");
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