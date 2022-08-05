import { vercel } from "./vercel.mjs";

const project = await vercel("/");

if (!project?.env?.find(env => env.key === "VERCEL_ACCESS_TOKEN" && env.target.includes("preview"))) {
  console.log("Creating VERCEL_ACCESS_TOKEN environment variable...");
  await vercel("/env", {
    method: "POST",
    body: JSON.stringify({
      key: "VERCEL_ACCESS_TOKEN",
      target: ["preview"],
      type: "encrypted",
      value: process.env.VERCEL_ACCESS_TOKEN,
    }),
  });
  console.log("VERCEL_ACCESS_TOKEN environment variable created.");
}

const commandForIgnoringBuildStep = `curl -sS "https://raw.githubusercontent.com/snaplet/vercel-action/main/scripts/ignore-build.mjs" | node --input-type=module`;
if (project?.commandForIgnoringBuildStep !== commandForIgnoringBuildStep) {
  console.log("Setting Ignored Build Step Command...");
  await vercel("/", {
    method: "PATCH",
    body: JSON.stringify({
      commandForIgnoringBuildStep,
    }),
  });
  console.log("Ignored Build Step Command set.");
}