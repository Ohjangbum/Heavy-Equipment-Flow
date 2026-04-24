import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    // try fallback for bundled version
    const bundledPath = path.resolve(__dirname, "public");
    if (fs.existsSync(bundledPath)) {
      app.use(express.static(bundledPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(bundledPath, "index.html"));
      });
      return;
    }
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
