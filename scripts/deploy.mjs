import { vercel } from "./vercel.mjs";

const project = await vercel("/");

let deployHookUrl = project?.link?.deployHooks?.find(deployHook => deployHook.ref === process.env.GITHUB_HEAD_REF)?.url;

const deployHookExists = Boolean(deployHookUrl)

if (!deployHookExists) {
  console.log("Creating deploy hook...");
  const updatedProject = await vercel("/deploy-hooks", {
    method: "POST",
    body: JSON.stringify({
      name: process.env.GITHUB_HEAD_REF,
      ref: process.env.GITHUB_HEAD_REF,
    }),
  });
  deployHookUrl = updatedProject?.link?.deployHooks?.find(deployHook => deployHook.ref === process.env.GITHUB_HEAD_REF)?.url;
  console.log("Deploy hook created.");

  const environmentVariables = process.env.VERCEL_PREVIEW_ENV
    .trim()
    .split("\n")
    .filter(line => line.trim().length > 0 && !line.trim().startsWith("#"))
    .map(line => {
      const [key, ...parts] = line.trim().split("=");
      const value = parts.join("=");
      return { key, value };
    });
  await Promise.all(environmentVariables
    .map(async ({ key, value }) => {
      console.log(`Creating ${key} environment variable...`);
      await vercel("/env", {
        method: "POST",
        body: JSON.stringify({
          gitBranch: process.env.GITHUB_HEAD_REF,
          key,
          target: ["preview"],
          type: "encrypted",
          value,
        }),
      });
      console.log(`${key} environment variable created.`);
    })
  );
}

console.log("Creating deployment...");
const { job } = await fetch(deployHookUrl, { method: "POST" });
console.log("Deployment created.");

if (process.env.AWAIT_FOR_DEPLOYMENT === "true") {
  console.log("Waiting for deployment to be ready...");
  const deployment = await awaitForDeploymentToBeReady(job.createdAt);
  console.log("Deployment ready.");
  console.log(`::set-output name=deployment-url::${deployment.url}`);
}

async function awaitForDeploymentToBeReady(createdAt) {
  const url = new URL("https://api.vercel.com/v6/deployments");
  url.search = new URLSearchParams({
    projectId: process.env.VERCEL_PROJECT_ID,
    "meta-githubCommitRef": process.env.GITHUB_HEAD_REF,
    since: createdAt,
    limit: 1,
    ...(process.env.VERCEL_TEAM_ID && { teamId: process.env.VERCEL_TEAM_ID }),
  });

  const { deployments: [deployment] } = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` }
  }).then(res => res.json());

  switch (deployment?.state) {
    case "READY":
      return deployment;
    case "ERROR":
      throw new Error("Deployment failed");
    default:
      await new Promise(resolve => setTimeout(resolve, 2000));
      return awaitForDeploymentToBeReady(createdAt);
  }
}