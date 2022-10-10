import { vercel } from './vercel.mjs';

const project = await vercel('/');

let deployHookUrl = project?.link?.deployHooks?.find(
  (deployHook) => deployHook.ref === process.env.GITHUB_HEAD_REF
)?.url;

const deployHookExists = Boolean(deployHookUrl);

if (!deployHookExists) {
  console.log('Creating deploy hook...');
  const updatedProject = await vercel('/deploy-hooks', {
    method: 'POST',
    body: JSON.stringify({
      name: process.env.GITHUB_HEAD_REF,
      ref: process.env.GITHUB_HEAD_REF,
    }),
  });
  deployHookUrl = updatedProject?.link?.deployHooks?.find(
    (deployHook) => deployHook.ref === process.env.GITHUB_HEAD_REF
  )?.url;
  console.log('Deploy hook created.');
  console.log(deployHookUrl);

  const environmentVariables = process.env.VERCEL_PREVIEW_ENV.trim()
    .split('\n')
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'))
    .map((line) => {
      const [key, ...parts] = line.trim().split('=');
      const value = parts.join('=');
      return { key, value };
    });
  await Promise.all(
    environmentVariables.map(async ({ key, value }) => {
      console.log(`Creating ${key} environment variable...`);
      await vercel('/env', {
        method: 'POST',
        body: JSON.stringify({
          gitBranch: process.env.GITHUB_HEAD_REF,
          key,
          target: ['preview'],
          type: 'encrypted',
          value,
        }),
      });
      console.log(`${key} environment variable created.`);
    })
  );
}

console.log('Creating deployment...');
await fetch(deployHookUrl, { method: 'POST' });
console.log('Deployment created.');
