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

if (process.env.VERCEL_TEAM_ID && !project?.env?.find(env => env.key === "VERCEL_TEAM_ID" && env.target.includes("preview"))) {
  console.log("Creating VERCEL_TEAM_ID environment variable...");
  await vercel("/env", {
    method: "POST",
    body: JSON.stringify({
      key: "VERCEL_TEAM_ID",
      target: ["preview"],
      type: "encrypted",
      value: process.env.VERCEL_TEAM_ID,
    }),
  });
  console.log("VERCEL_TEAM_ID environment variable created.");
}

const ignoredBranches = process.env.IGNORED_BRANCHES || "";
const commandForIgnoringBuildStep = `${process.env.IGNORED_BUILD_COMMAND} - -b ${ignoredBranches.join(",")}`;
if (commandForIgnoringBuildStep && project?.commandForIgnoringBuildStep !== commandForIgnoringBuildStep) {
  console.log("Setting Ignored Build Step Command...");
  await vercel("/", {
    method: "PATCH",
    body: JSON.stringify({
      commandForIgnoringBuildStep,
    }),
  });
  console.log("Ignored Build Step Command set.");
}