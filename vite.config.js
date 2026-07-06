import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Serves api/structure.js locally with the same (req, res) contract Vercel
// gives it in production, so `npm run dev` exercises the real handler.
function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api/structure", (req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch {
            req.body = {};
          }
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (obj) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(obj));
            return res;
          };
          try {
            const { default: handler } = await server.ssrLoadModule("/api/structure.js");
            await handler(req, res);
          } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Local API handler crashed — check the dev server log." });
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.MERGE_API_KEY) process.env.MERGE_API_KEY = env.MERGE_API_KEY;
  return {
    plugins: [react(), localApi()],
  };
});
