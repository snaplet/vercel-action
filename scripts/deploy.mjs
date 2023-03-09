console.log("Updating environment variables...");
await updateEnvironmentVariables();
console.log("Deployment updated.");

console.log("Creating deployment...");
let deployment = await createNewDeploymentForBranch(
  process.env.GITHUB_HEAD_REF
);
console.log("Deployment created.");

if (process.env.AWAIT_FOR_DEPLOYMENT === "true") {
  console.log("Waiting for deployment to be ready...");
  deployment = await awaitForDeploymentToBeReady(deployment);
  console.log("Deployment ready.");
  console.log(`::set-output name=deployment-url::${deployment.url}`);
}

async function updateEnvironmentVariables() {
  const environmentVariables = process.env.VERCEL_PREVIEW_ENV.trim()
    .split("\n")
    .filter(line => line.trim().length > 0 && !line.trim().startsWith("#"))
    .map(line => {
      const [key, ...parts] = line.trim().split("=");
      const value = parts.join("=");
      return { key, value };
    });

  if (environmentVariables.length === 0) {
    return;
  }

  const url = new URL(
    `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/env`
  );
  url.search = new URLSearchParams({
    ...(process.env.VERCEL_TEAM_ID && { teamId: process.env.VERCEL_TEAM_ID }),
    upsert: true,
  });

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      environmentVariables.map(({ key, value }) => ({
        gitBranch: process.env.GITHUB_HEAD_REF,
        key,
        target: ["preview"],
        type: "encrypted",
        value,
      }))
    ),
  })
    .then(async res => {
      if (!res.ok) {
        const errResponse = await res.json();
        throw new Error(
          errResponse?.error?.message ??
            "Could not create environment variables"
        );
      }
      return res.json();
    })
    .then(res => {
      // Since we are doing a batch upsert of environment variables it could
      // still be the case that the creation of one in the batch failed.
      if (res.failed?.length > 0) {
        throw new Error(
          res.failed[0].message ?? "Updating environment variables failed."
        );
      }

      return res;
    });
}

async function createNewDeploymentForBranch(branchName) {
  const url = new URL("https://api.vercel.com/v13/deployments");
  url.search = new URLSearchParams({
    ...(process.env.VERCEL_TEAM_ID && { teamId: process.env.VERCEL_TEAM_ID }),
    forceNew: 1,
  });

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Name prefix is important here as it is used in the build ignore step
      // to determine if it was created by this action.
      name: `snaplet-action-${process.env.GITHUB_SHA.substring(0, 7)}`,
      project: process.env.VERCEL_PROJECT_ID,
      gitSource: {
        ref: branchName,
        repoId: process.env.GITHUB_REPOSITORY_ID,
        type: "github",
        sha: process.env.GITHUB_SHA,
      },
    }),
  }).then(async res => {
    if (!res.ok) {
      const errResponse = await res.json();
      throw new Error(
        errResponse?.error?.message ?? "Could not create deployment"
      );
    }
    return res.json();
  });
}

async function awaitForDeploymentToBeReady(deployment) {
  const url = new URL(
    `https://api.vercel.com/v13/deployments/${deployment.id}`
  );
  url.search = new URLSearchParams({
    ...(process.env.VERCEL_TEAM_ID && { teamId: process.env.VERCEL_TEAM_ID }),
  });

  const freshDeployment = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` },
  }).then(async res => {
    if (!res.ok) {
      const errResponse = await res.json();
      throw new Error(
        errResponse?.error?.message ?? "Could not get deployment"
      );
    }

    return res.json();
  });

  switch (freshDeployment?.readyState) {
    case "READY":
      return freshDeployment;
    case "CANCELED":
      throw new Error("Deployment cancelled");
    case "ERROR":
      throw new Error("Deployment failed");
    default:
      await new Promise(resolve => setTimeout(resolve, 2000));
      return awaitForDeploymentToBeReady(freshDeployment);
  }
}
