import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { requestTrackingMiddleware, errorTrackingMiddleware, performanceMonitoringMiddleware } from "./middleware/observability.middleware";
import cron from "node-cron";
import { pullPerplexityTrends } from "./services/perplexityTrendFetcher";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Wire observability middleware globally
app.use(requestTrackingMiddleware('api'));
app.use(performanceMonitoringMiddleware({ 
  trackDetailedMetrics: true, 
  slowRequestThreshold: 2000, 
  service: 'api' 
}));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

const server = app.listen({
  port: 5000,
  host: "0.0.0.0",
  reusePort: true,
});

(async () => {
  await registerRoutes(app);

  // Wire error tracking middleware
  app.use(errorTrackingMiddleware('api'));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files from dist/public
  const distPath = path.resolve(process.cwd(), "dist/public");
  app.use(express.static(distPath));
  
  // Fall through to index.html for client-side routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  console.log(`serving on port 5000`);
  
  // Initialize services
  try {
    const { resumeInterruptedJobs } = await import('./api/automated-bulk-generation');
    await resumeInterruptedJobs();
  } catch (error) {
    console.error('❌ Failed to resume interrupted jobs:', error);
  }
  
  try {
    const { initializePerplexityCron } = await import('./services/perplexityCron');
    initializePerplexityCron();
  } catch (error) {
    console.error('❌ Failed to initialize Perplexity automation:', error);
  }
})();