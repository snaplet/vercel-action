export const vercel = (url, options = {}) => fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}${url}`, {
  ...options,
  headers: {
    Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
}).then(res => res.json());