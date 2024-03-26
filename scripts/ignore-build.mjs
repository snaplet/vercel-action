import https from "node:https";

// get ignored branches
let ignoredBranches = [];
if (process.argv[2] && process.argv[2] === '-b') {
  ignoredBranches = process.argv[3].split(',');
}

// dumb fetch implementation
const fetch = (url, options = {}) => new Promise((resolve, reject) => {
  const req = https.request(url, options, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return reject(new Error('statusCode=' + res.statusCode));
    }
    let chunks = [];
    res.on("data", (chunk) => { chunks.push(chunk) });
    res.on("end", () => resolve({ json: () => JSON.parse(Buffer.concat(chunks).toString()) }));
  }).on("error", reject);
  req.end();
});

if (process.env.VERCEL_ENV === "preview" && !ignoredBranches.includes(process.env.VERCEL_GIT_COMMIT_REF)) {
  const teamId = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
  const deployment = await fetch(`https://api.vercel.com/v13/deployments/${process.env.VERCEL_URL}${teamId}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` }
  }).then(res => res.json());
  if (!deployment.name.startsWith('snaplet-action-')) {
    process.exit(0);
  }
}

process.exit(1);