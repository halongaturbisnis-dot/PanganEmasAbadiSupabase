import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cron from "node-cron";
import app from "./api/index";
import { databaseActiveService } from "./src/logic/services/databaseActiveService";

async function startServer() {
  const PORT = 3000;

  // 1. Database Ping Cron Job
  // Schedule to run at 2 AM every day
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Running daily database keep-alive ping at 02:00 AM");
    await databaseActiveService.ping('CRON');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Cron job scheduled for 02:00 AM daily`);
  });
}

startServer();
