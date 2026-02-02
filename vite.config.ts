import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal mock API to test charm entry flows
function mockApi() {
  return {
    name: "mock-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith("/api/")) return next();

        const sendJson = (obj: any, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        };

        const readBody = async () =>
          new Promise<any>((resolve) => {
            let data = "";
            req.on("data", (c: any) => (data += c));
            req.on("end", () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });

        // Token -> code mapping for testing
        // Use tokens like: t:OPEN, t:GLYPH, t:UNCLAIMED, t:EXPIRED, t:MISSING
        const mapTokenToCode = (token: string) =>
          token.startsWith("t:") ? token.slice(2) : "OPEN";

        // POST /api/entry/by-token  { token }
        if (req.method === "POST" && req.url === "/api/entry/by-token") {
          const body = await readBody();
          const token = String(body?.token ?? "");
          const code = mapTokenToCode(token);

          if (code === "MISSING") return sendJson({ kind: "not_found" });
          if (code === "EXPIRED") return sendJson({ kind: "expired" });

          if (code === "UNCLAIMED") return sendJson({ kind: "unclaimed", code });

          // Claimed examples
          if (code === "GLYPH")
            return sendJson({ kind: "claimed", code, configured: true, authMode: "glyph", attemptsLeft: 3 });

          return sendJson({ kind: "claimed", code, configured: true, authMode: "none" });
        }
        // GET /api/c/:code/playback-url
        if (req.method === "GET" && /\/api\/c\/.+\/playback-url$/.test(req.url)) {
          return sendJson({
            memoryType: "video",
            playbackUrl:
              "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          });
        }

        // GET /api/entry/by-code/:code
        if (req.method === "GET" && req.url.startsWith("/api/entry/by-code/")) {  
          const code = decodeURIComponent(req.url.split("/").pop() || "");

          if (code === "MISSING") return sendJson({ kind: "not_found" });
          if (code === "EXPIRED") return sendJson({ kind: "expired" });

          if (code === "UNCLAIMED") return sendJson({ kind: "unclaimed", code });

          if (code === "GLYPH")
            return sendJson({ kind: "claimed", code, configured: true, authMode: "glyph", attemptsLeft: 3 });

          return sendJson({ kind: "claimed", code, configured: true, authMode: "none" });
        }

        return sendJson({ error: "mock: unknown endpoint", url: req.url }, 404);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApi()],
});
