import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import { db } from "./db.js";
import { users } from "../shared/models/auth.js";
import { eq } from "drizzle-orm";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// 1. Initialization waiter middleware at the very top
let resolveSetup: () => void;
let rejectSetup: (err: any) => void;
const setupPromise = new Promise<void>((resolve, reject) => {
  resolveSetup = resolve;
  rejectSetup = reject;
});

app.use(async (req, res, next) => {
  try {
    await setupPromise;
    next();
  } catch (error) {
    console.error("Setup waiter failed:", error);
    res.status(500).send("Internal Server Error: Application failed to initialize");
  }
});

// 2. Register all routes and configuration within the setup process
(async () => {
  try {
    app.use(
      express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: false }));

    // Logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      });

      next();
    });

    // DB initialization tasks
    try {
      const [firstUser] = await db.select().from(users).where(eq(users.employeeId, "1001")).limit(1);
      if (firstUser && firstUser.role !== "admin") {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, firstUser.id));
        log(`Auto-promoted first user (${firstUser.email}) to admin`);
      }
    } catch (e) {
      log(`Database initialization warning: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Register API routes
    await registerRoutes(httpServer, app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    // Register static routes or Vite
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    // Listen only if not on Vercel
    if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
      const port = parseInt(process.env.PORT || "5000", 10);
      httpServer.listen(
        {
          port,
          host: "0.0.0.0",
          reusePort: true,
        },
        () => {
          log(`serving on port ${port}`);
        },
      );
    }
    
    resolveSetup();
  } catch (error) {
    console.error("Initialization failed:", error);
    rejectSetup(error);
  }
})();

// 3. Export the app for Vercel
export { app };
export default app;
