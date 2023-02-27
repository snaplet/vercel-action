console.log("Creating deployment...")
let deployment = await createNewDeploymentForBranch(process.env.GITHUB_HEAD_REF)
console.log("Deployment created.")

if (process.env.AWAIT_FOR_DEPLOYMENT === "true") {
  console.log("Waiting for deployment to be ready...")
  deployment = await awaitForDeploymentToBeReady(deployment)
  console.log("Deployment ready.")
  console.log(`::set-output name=deployment-url::${deployment.url}`)
}

async function createNewDeploymentForBranch(branchName) {
  const url = new URL("https://api.vercel.com/v13/deployments")
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: process.env.VERCEL_PROJECT_ID,
      gitSource: {
        ref: branchName,
        repoId: process.env.GITHUB_REPOSITORY_ID,
        type: "github",
        sha: process.env.GITHUB_HEAD_REF,
      },
      target: "staging",
    }),
  }).then(async res => {
    if (!res.ok) {
      const errResponse = await res.json()
      throw new Error(
        errResponse?.error?.message ?? "Could not create deployment"
      )
    }
    return res.json()
  })
}

async function awaitForDeploymentToBeReady(deployment) {
  const url = new URL(`https://api.vercel.com/v13/deployments/${deployment.id}`)
  const freshDeployment = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` },
  }).then(async res => {
    if (!res.ok) {
      const errResponse = await res.json()
      throw new Error(errResponse?.error?.message ?? "Could not get deployment")
    }

    return res.json()
  })

  switch (freshDeployment?.readyState) {
    case "READY":
      return freshDeployment
    case "ERROR":
      throw new Error("Deployment failed")
    default:
      await new Promise(resolve => setTimeout(resolve, 2000))
      return awaitForDeploymentToBeReady(freshDeployment)
  }
}
