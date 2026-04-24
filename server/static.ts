import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const bundledPath = path.resolve(__dirname, "public");

  let publicPath = "";

  if (fs.existsSync(distPath)) {
    publicPath = distPath;
  } else if (fs.existsSync(bundledPath)) {
    publicPath = bundledPath;
  }

  if (!publicPath) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`Could not find static build directory in ${distPath} or ${bundledPath}`);
    }
    return;
  }

  app.use(express.static(publicPath));

  // Catch-all route for SPA, but avoid intercepting API calls
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}
