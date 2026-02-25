import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * In-memory "database" for the dev server lifetime.
 * Restarting the dev server clears this.
 */
type CharmRecord = {
  claimed: boolean;
  configured: boolean;
  authMode: "none" | "glyph";
  attemptsLeft: number;
  memoryType?: "video" | "image" | "audio";
  playbackUrl?: string;
};

const charms = new Map<string, CharmRecord>();

type UserProfile = {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  cellNumber: string;
};

let userProfile: UserProfile | null = null;

function getOrCreateCharm(code: string): CharmRecord {
  const existing = charms.get(code);
  if (existing) return existing;

  const rec: CharmRecord = {
    claimed: false,
    configured: false,
    authMode: "none",
    attemptsLeft: 3,
  };
  charms.set(code, rec);
  return rec;
}

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
        // Tokens like t:OPEN, t:GLYPH, etc.
        const mapTokenToCode = (token: string) =>
          token.startsWith("t:") ? token.slice(2) : "OPEN";

        // ----------------------------
        // AUTH (mock)
        // ----------------------------
        if (req.method === "POST" && req.url === "/api/auth/mock-login") {
          const body = await readBody();
          const name = String(body?.name ?? "Keeper");
          const email = String(body?.email ?? "keeper@example.com");
          return sendJson({
            ok: true,
            user: { id: "u_1", name, email },
          });
        }

        // ----------------------------
        // ENTRY
        // ----------------------------
        if (req.method === "POST" && req.url === "/api/entry/by-token") {
          const body = await readBody();
          const token = String(body?.token ?? "");
          const code = mapTokenToCode(token);

          if (code === "MISSING") return sendJson({ kind: "not_found" });
          if (code === "EXPIRED") return sendJson({ kind: "expired" });

          const rec = getOrCreateCharm(code);

          if (code === "UNCLAIMED" && !rec.claimed) return sendJson({ kind: "unclaimed", code });

          if (!rec.claimed) {
            rec.claimed = true;
            rec.configured = true;
            rec.authMode = code === "GLYPH" ? "glyph" : "none";
            rec.attemptsLeft = 3;
          }

          return sendJson({
            kind: "claimed",
            code,
            configured: rec.configured,
            authMode: rec.authMode,
            attemptsLeft: rec.attemptsLeft,
          });
        }

        if (req.method === "GET" && req.url.startsWith("/api/entry/by-code/")) {
          const code = decodeURIComponent(req.url.split("/").pop() || "");

          if (code === "MISSING") return sendJson({ kind: "not_found" });
          if (code === "EXPIRED") return sendJson({ kind: "expired" });

          const rec = getOrCreateCharm(code);

          if (code === "UNCLAIMED" && !rec.claimed) return sendJson({ kind: "unclaimed", code });

          if (!rec.claimed) {
            rec.claimed = true;
            rec.configured = true;
            rec.authMode = code === "GLYPH" ? "glyph" : "none";
            rec.attemptsLeft = 3;
          }

          return sendJson({
            kind: "claimed",
            code,
            configured: rec.configured,
            authMode: rec.authMode,
            attemptsLeft: rec.attemptsLeft,
          });
        }

        // ----------------------------
        // CLAIM / CONFIGURE / UPLOAD (mock)
        // ----------------------------
        if (req.method === "POST" && req.url === "/api/charm/claim") {
          const body = await readBody();
          const code = String(body?.code ?? "").trim();
          if (!code) return sendJson({ ok: false, message: "Missing code" }, 400);

          const rec = getOrCreateCharm(code);
          rec.claimed = true;
          rec.configured = false;
          rec.authMode = "none";
          rec.attemptsLeft = 3;

          return sendJson({ ok: true, charmId: `ch_${code}`, code });
        }

        if (req.method === "POST" && req.url === "/api/charm/configure") {
          const body = await readBody();
          const code = String(body?.code ?? "").trim();
          const memoryType = body?.memoryType as "video" | "image" | "audio";
          const authMode = body?.authMode as "none" | "glyph";

          if (!code) return sendJson({ ok: false, message: "Missing code" }, 400);
          if (!memoryType) return sendJson({ ok: false, message: "Missing memoryType" }, 400);
          if (authMode !== "none" && authMode !== "glyph")
            return sendJson({ ok: false, message: "Invalid authMode" }, 400);

          const rec = getOrCreateCharm(code);
          if (!rec.claimed) return sendJson({ ok: false, message: "Not claimed" }, 400);

          rec.memoryType = memoryType;
          rec.authMode = authMode;
          rec.attemptsLeft = 3;
          rec.configured = true;

          return sendJson({ ok: true, code });
        }

        if (req.method === "POST" && req.url === "/api/charm/upload") {
          const body = await readBody();
          const code = String(body?.code ?? "").trim();
          const memoryType = body?.memoryType as "video" | "image" | "audio";

          if (!code) return sendJson({ ok: false, message: "Missing code" }, 400);
          if (!memoryType) return sendJson({ ok: false, message: "Missing memoryType" }, 400);

          const rec = getOrCreateCharm(code);
          if (!rec.claimed) return sendJson({ ok: false, message: "Not claimed" }, 400);
          if (!rec.configured) return sendJson({ ok: false, message: "Not configured" }, 400);

          if (memoryType === "video") {
            rec.playbackUrl =
              "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
          } else if (memoryType === "image") {
            rec.playbackUrl =
              "https://interactive-examples.mdn.mozilla.net/media/examples/flower.jpg";
          } else {
            rec.playbackUrl =
              "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";
          }

          rec.memoryType = memoryType;

          return sendJson({
            ok: true,
            code,
            memoryType,
            playbackUrl: rec.playbackUrl,
          });
        }

        // ----------------------------
        // GLYPH VERIFY + PLAYBACK
        // ----------------------------
        if (req.method === "POST" && /\/api\/c\/.+\/auth\/verify-glyph$/.test(req.url)) {
          const body = await readBody();
          const glyph = String(body?.glyph ?? "");
          const parts = req.url.split("/");
          const code = decodeURIComponent(parts[3] || "");

          const rec = getOrCreateCharm(code);
          if (!rec.claimed) return sendJson({ ok: false, attemptsLeft: 0 }, 403);

          if (glyph === "7") {
            rec.attemptsLeft = 3;
            return sendJson({ ok: true, attemptsLeft: rec.attemptsLeft });
          }

          rec.attemptsLeft = Math.max(0, (rec.attemptsLeft ?? 3) - 1);
          return sendJson({ ok: false, attemptsLeft: rec.attemptsLeft });
        }

        if (req.method === "GET" && /\/api\/c\/.+\/playback-url$/.test(req.url)) {
          const parts = req.url.split("/");
          const code = decodeURIComponent(parts[3] || "");
          const rec = getOrCreateCharm(code);

          if (rec.playbackUrl && rec.memoryType) {
            return sendJson({ memoryType: rec.memoryType, playbackUrl: rec.playbackUrl });
          }

          return sendJson({
            memoryType: "video",
            playbackUrl:
              "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          });
        }

        // ----------------------------
        // USER PROFILE
        // ----------------------------
        if (req.method === "GET" && req.url === "/api/user/me") {
          return sendJson({
            hasProfile: userProfile !== null,
            profile: userProfile,
          });
        }

        if (req.method === "POST" && req.url === "/api/user/profile") {
          const body = await readBody();
          const { firstName, lastName, address, email, cellNumber } = body;

          if (!firstName || !lastName || !email) {
            return sendJson({ ok: false, message: "firstName, lastName, and email are required" }, 400);
          }

          userProfile = {
            firstName: String(firstName),
            lastName: String(lastName),
            address: String(address ?? ""),
            email: String(email),
            cellNumber: String(cellNumber ?? ""),
          };

          return sendJson({ ok: true, profile: userProfile });
        }

        return sendJson({ error: "mock: unknown endpoint", url: req.url }, 404);
      });
    },
  };
}

export default defineConfig(() => {
  const useMock = process.env.VITE_USE_MOCK === "true";

  return {
    plugins: [react(), ...(useMock ? [mockApi()] : []), cloudflare()],
    server: useMock
      ? {}
      : {
          proxy: {
            "/api": {
              target: "https://memorycharms-f6ftf7habefudsey.centralus-01.azurewebsites.net",
              changeOrigin: true,
              secure: true,
            },
            "/azurite": {
              target: "http://127.0.0.1:10000",
              changeOrigin: true,
              rewrite: (path: string) => path.replace(/^\/azurite/, ""),
            },
          },
        },
  };
});