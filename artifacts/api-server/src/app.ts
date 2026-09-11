import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.disable("etag");

const configuredFrontendOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAlBaronVercelPreview(origin: string) {
  try {
    const url = new URL(origin);
    const isProductionAlias =
      url.hostname === "al-baron-barber-arara-al-baron-mobi-blue.vercel.app";
    const isProjectDeployment =
      url.hostname.startsWith("al-baron-barber-arara-al-baron-mobile-5zq2-") &&
      url.hostname.endsWith(".vercel.app");

    return (
      url.protocol === "https:" &&
      (isProductionAlias || isProjectDeployment)
    );
  } catch {
    return false;
  }
}

function corsOrigin(origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) {
  if (!origin) return callback(null, true);
  if (configuredFrontendOrigins.length > 0) {
    return callback(null, configuredFrontendOrigins.includes(origin) || isAlBaronVercelPreview(origin));
  }
  return callback(null, process.env.NODE_ENV !== "production");
}

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "al-baron-api" });
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

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
app.use(cors({ credentials: true, origin: corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", router);

export default app;
