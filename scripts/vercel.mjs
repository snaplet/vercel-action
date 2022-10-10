export const vercel = (url, options = {}) => {
  const teamId = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';

  return fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}${url}${teamId}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  }).then(res => res.json())
};