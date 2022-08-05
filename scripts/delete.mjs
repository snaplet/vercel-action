import { vercel } from "./vercel.mjs";

const project = await vercel("/");

const deployHookId = project.link.deployHooks.find(deployHook => deployHook.ref === process.env.GITHUB_HEAD_REF)?.id;
if (deployHookId) {
  console.log("Deleting deploy hook...");
  await vercel(`/deploy-hooks/${deployHookId}`, { method: "DELETE" });
  console.log("Deploy hook deleted.");
}

await Promise.all(
  project.env
    .filter((env) => env.target[0] === "preview" && env.gitBranch === process.env.GITHUB_HEAD_REF)
    .map(async (env) => {
      console.log(`Deleting ${env.key} environment variable...`);
      await vercel(`/env/${env.id}`, { method: "DELETE" });
      console.log(`${env.key} environment variable deleted.`);
    })
);