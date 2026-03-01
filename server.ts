import { INVALID_RANGES } from "./src/constants";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/scan", async (req, res) => {
    try {
      const { denomination, serial, series } = req.body;
      
      if (denomination === undefined || serial === undefined) {
        return res.status(400).json({ error: "Denomination and serial are required" });
      }

      const denomNum = parseInt(denomination.toString(), 10);
      const serialNum = parseInt(serial.toString().replace(/\D/g, ''), 10);
      const seriesLetter = series ? series.toString().toUpperCase() : '';

      if (isNaN(denomNum) || isNaN(serialNum)) {
        return res.status(400).json({ error: "Invalid denomination or serial format" });
      }

      // Validation only applies to Series B and denominations 10, 20, 50
      let isInvalid = false;
      let matchingRange = null;

      if (seriesLetter === 'B' && [10, 20, 50].includes(denomNum)) {
        const ranges = INVALID_RANGES[denomNum] || [];
        matchingRange = ranges.find(r => serialNum >= r.from && serialNum <= r.to);
        isInvalid = !!matchingRange;
      }

      res.json({
        denomination: denomNum,
        serial: serialNum.toString(),
        series: seriesLetter,
        is_invalid: isInvalid,
        range_from: matchingRange?.from,
        range_to: matchingRange?.to,
        is_series_b: seriesLetter === 'B'
      });
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
