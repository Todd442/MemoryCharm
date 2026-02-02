import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal mock API for testing UI flows.
function mockApi() {
  return {
    name: "mock-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith("/api/")) return next();

        // Helper
        const sendJson = (obj: any, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        };

        // Parse JSON body for POSTs
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

        // ---- MOCK BEHAVIOR SWITCHES ----
        // You can change these to test different flows
        const MOCK = {
          unclaimedCode: "UNCLAIMED",
          glyphCode: "GLYPH",
          openCode: "OPEN",
          expiredCode: "EXPIRED",
        };

        // POST /api/entry/by-token  { token }
        if (req.method === "POST" && req.url === "/api/entry/by-token") {
          const body = await readBody();
          const token = String(body?.token ?? "");

          // Map token -> code (simple for testing)
          // token like "t:OPEN" or "t:GLYPH" etc.
          const code = token.startsWith("t:") ? token.slice(2) : MOCK.openCode;

          if (code === MOCK.expiredCode) return sendJson({ kind: "expired" });
          if (code === "MISSING") return sendJson({ kind: "not_found" });

          if (code === MOCK.unclaimedCode) return sendJson({ kind: "unclaimed", code });
          if (code === MOCK.glyphCode)
            return sendJson({
              kind: "claimed",
              code,
              configured: true,
              authMode: "glyph",
              attemptsLeft: 3,
              memoryType: "video",
            });

          return sendJson({
            kind: "claimed",
            code,
            configured: true,
            authMode: "none",
            memoryType: "video",
          });
        }

        // GET /api/entry/by-code/:code
        if (req.method === "GET" && req.url.startsWith("/api/entry/by-code/")) {
          const code = decodeURIComponent(req.url.split("/").pop() || "");
          if (code === MOCK.expiredCode) return sendJson({ kind: "expired" });
          if (code === "MISSING") return sendJson({ kind: "not_found" });

          if (code === MOCK.unclaimedCode) return sendJson({ kind: "unclaimed", code });
          if (code === MOCK.glyphCode)
            return sendJson({
              kind: "claimed",
              code,
              configured: true,
              authMode: "glyph",
              attemptsLeft: 3,
              memoryType: "video",
            });

          return sendJson({
            kind: "claimed",
            code,
            configured: true,
            authMode: "none",
            memoryType: "video",
          });
        }

        // POST /api/c/:code/auth/verify-glyph
        if (req.method === "POST" && /\/api\/c\/.+\/auth\/verify-glyph$/.test(req.url)) {
          const code = decodeURIComponent(req.url.split("/")[3] || "");
          const body = await readBody();
          const glyph = String(body?.glyph ?? "");

          // Only accept glyph "7" in mock
          if (code === MOCK.glyphCode && glyph === "7") return sendJson({ ok: true, attemptsLeft: 3 });

          // decrement attempts in a dumb way (always returns 2 then 1 then 0 is not tracked here)
          // For quick testing, just return 2 attempts left if wrong.
          return sendJson({ ok: false, attemptsLeft: 2 });
        }

        // GET /api/c/:code/playback-url
        if (req.method === "GET" && /\/api\/c\/.+\/playback-url$/.test(req.url)) {
          // Sample mp4 that should play in most browsers
          // You can replace with your own hosted media later.
          return sendJson({
            memoryType: "video",
            playbackUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          });
        }

        // Default for unknown /api calls
        return sendJson({ error: "mock: unknown endpoint", url: req.url }, 404);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApi()],
});
