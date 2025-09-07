
import dotenv from "dotenv";
import { Vercel } from "@vercel/sdk";
import { error } from "console";

dotenv.config();
const vercel = new Vercel({
    bearerToken: process.env.VERCEL_TOKEN
});

function parseGitHubURL(urlStr: string) {
    try {
        const url = new URL(urlStr);
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length < 2) return null;
        const [account, repo] = parts;
        return { account, repo: repo.replace(".git", "") };
    } catch {
        return null;
    }
}

function isValidGitHubURL(urlStr: string) {
    try {
        const url = new URL(urlStr);
        return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2;
    } catch {
        return false;
    }
}

async function getValidBranch(account: string, repo: string) {
    const res = await fetch(`https://api.github.com/repos/${account}/${repo}/branches`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des branches.");
    const branches = await res.json();
    for (const branch of branches) {
        if (branch.name === "main" || branch.name === "master") return branch.name;
    }
    throw new Error("Branche 'main' et 'master' introuvable.");
}

async function createAndCheckDeployment(repo_name:string, account_name:string, branch:string) {
    try {
        // Create a new deployment from GitHub repo
        const createResponse = await vercel.deployments.createDeployment({
            requestBody: {
                name: "my-web-app",
                target: "production",
                gitSource: {
                    type: "github",
                    repo: repo_name,
                    ref: branch,
                    org: account_name,
                }
            },
        });

        const deploymentId = createResponse.id;
        console.log(
            `Deployment created: ID ${deploymentId} and status ${createResponse.status}`
        );

        // Optionally, poll for deployment status
        let deploymentStatus = createResponse.status;
        let deploymentURL = createResponse.url;
        while (
            deploymentStatus !== "CANCELED" ||
            deploymentStatus !== "ERROR" ||
            deploymentStatus !== "READY"
        ) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            const statusResponse = await vercel.deployments.getDeployment({
                idOrUrl: deploymentId,
                withGitRepoInfo: "true",
            });
            deploymentStatus = statusResponse.status;
            deploymentURL = statusResponse.url;
            console.log(`Deployment status: ${deploymentStatus}`);
        }

        if (deploymentStatus === "READY") {
            console.log(`Deployment successful. URL: ${deploymentURL}`);
        } else {
            // Fetch the latest deployment status for more details
            const details = await vercel.deployments.getDeployment({
                idOrUrl: deploymentId,
                withGitRepoInfo: "true",
            });
            console.log("Deployment failed or was canceled");
            console.log("Full deployment details:", details);
        }
    } catch (error) {
        console.error(
            error instanceof Error ? `Error: ${error.message}` : String(error)
        );
    }
}

async function main() {
    const githubURL = "https://github.com/shadokan87/Deploy-Anything";

    if (!isValidGitHubURL(githubURL)) {
        console.error("URL GitHub invalide.");
        return;
    }

    const parsed = parseGitHubURL(githubURL);
    if (!parsed) {
        console.error("Impossible d'extraire les informations de l'URL.");
        return;
    }

    try {
        const branch = await getValidBranch(parsed.account, parsed.repo);
        await createAndCheckDeployment(parsed.repo, parsed.account, branch);
    } catch (err) {
        console.error("Erreur :", err);
    }
}

main();
