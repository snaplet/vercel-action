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

  const prefix = process.env.ENV_PREVIEW_PREFIX;
  await Promise.all(Object
    .entries(process.env)
    .filter(([k]) => k.startsWith(prefix))
    .map(async ([k, value]) => {
      const key = k.replace(prefix, "");
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
await fetch(deployHookUrl, { method: "POST" });
console.log("Deployment created.");