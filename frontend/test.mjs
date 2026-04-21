import { loadEnv } from "vite";
const env = loadEnv("development", "/app", "");
const merged = { ...env, ...process.env };
console.log("FRONTEND_API_BASE_URL:", merged.FRONTEND_API_BASE_URL);
console.log("FRONTEND_WS_BASE_URL:", merged.FRONTEND_WS_BASE_URL);
console.log("process.env.FRONTEND_API_BASE_URL:", process.env.FRONTEND_API_BASE_URL);
