import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Railway/Render/etc. sit behind one reverse proxy. Without this, every client
// appears to have the proxy's IP and the rate limiters would share one bucket.
app.set("trust proxy", 1);

// ALLOWED_ORIGINS is a comma-separated list (e.g.
// "https://sakeena.app,https://www.sakeena.app"). Left unset, CORS stays
// permissive — fine for local/dev, but set this in production so the API
// only answers requests from the app's real domain(s).
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : {}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General ceiling on every /api request, per IP.
app.use(
  "/api",
  rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }),
);
// Tighter ceiling specifically on the endpoints most worth protecting from
// spam/abuse: public write-heavy ones a bot could hammer without even
// needing a device id (dua submissions, creating quiz/khatmah rooms).
app.use(
  ["/api/dua-wall", "/api/quiz-rooms", "/api/group-khatmah"],
  rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }),
);

app.use("/api", router);

// One-service deployment: when the web app has been built, serve it from here
// too. The app and the API then share one address (no CORS, sockets just work).
const webDir = process.env.FRONTEND_DIR ?? path.resolve(process.cwd(), "../sakeena-pwa/dist/public");
if (fs.existsSync(path.join(webDir, "index.html"))) {
  app.use(
    express.static(webDir, {
      index: false,
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        // The service worker and the HTML shell must never be served stale.
        if (/(sw\.js|index\.html)$/.test(filePath)) res.setHeader("Cache-Control", "no-cache");
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      next();
      return;
    }
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(webDir, "index.html"));
  });
}

export default app;
