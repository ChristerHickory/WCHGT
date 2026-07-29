import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGolfareSchema, insertBanaSchema, insertRundaSchema, insertTavlingSchema, insertTavlingsresultatSchema, insertReportageSchema } from "@shared/schema";

const ADMIN_PIN = process.env.ADMIN_PIN || "wchgt2026";

function requirePin(req: Request, res: Response, next: NextFunction) {
  const pin = req.headers["x-admin-pin"] as string | undefined;
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Ej behörig" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Golfare
  app.get("/api/golfare", (_, res) => res.json(storage.getAllGolfare()));
  app.get("/api/golfare/alla", (_, res) => res.json(storage.getAllGolfareInklusiveInaktiva()));
  app.get("/api/golfare/:id", (req, res) => {
    const g = storage.getGolfareById(Number(req.params.id));
    g ? res.json(g) : res.status(404).json({ error: "Golfare hittades inte" });
  });
  app.get("/api/golfare/:id/oom-historik", (req, res) => {
    try {
      res.json(storage.getOomHistorik(Number(req.params.id)));
    } catch (err: any) {
      console.error("getOomHistorik error:", err);
      res.status(500).json({ error: err?.message ?? "Serverfel" });
    }
  });

  app.get("/api/golfare/:id/tavlingsresultat", (req, res) => {
    try {
      const id = Number(req.params.id);
      const result = storage.getResultatByGolfare(id);
      res.json(result);
    } catch (err: any) {
      console.error("getResultatByGolfare error:", err);
      res.status(500).json({ error: err?.message ?? "Serverfel" });
    }
  });
  app.post("/api/golfare", requirePin, (req, res) => {
    const parsed = insertGolfareSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    // Beräkna hickory-handicap: 1.4 × standardhandicap
    const standardHandicap = parsed.data.standardHandicap ?? 36;
    const data = { ...parsed.data, standardHandicap, hickoryHandicap: standardHandicap * 1.4 };
    res.status(201).json(storage.createGolfare(data));
  });
  // PATCH par per hål på bana
  app.patch("/api/banor/:id/par", requirePin, (req, res) => {
    const id = Number(req.params.id);
    const { parPerHal } = req.body as { parPerHal: number[] };
    const result = storage.updateBanaPar(id, parPerHal);
    res.json(result);
  });

  // PATCH par-override på tävling
  app.patch("/api/tavlingar/:id/par", requirePin, (req, res) => {
    const id = Number(req.params.id);
    const { parOverride } = req.body as { parOverride: number[] | null };
    const result = storage.updateTavlingPar(id, parOverride);
    res.json(result);
  });

  app.patch("/api/golfare/:id/stamspelare", requirePin, (req, res) => {
    const id = Number(req.params.id);
    const { stamspelare } = req.body as { stamspelare: boolean };
    res.json(storage.setStamspelare(id, stamspelare));
  });

  app.patch("/api/golfare/:id/stamspelare/auto", requirePin, (req, res) => {
    const id = Number(req.params.id);
    const g = storage.clearStamspelareOverride(id);
    g ? res.json(g) : res.status(404).json({ error: "Golfare hittades inte" });
  });

  app.patch("/api/golfare/:id/handicap", requirePin, (req, res) => {
    const g = storage.updateGolfareHandicap(Number(req.params.id), req.body.hickoryHandicap);
    g ? res.json(g) : res.status(404).json({ error: "Golfare hittades inte" });
  });

  // Banor
  app.get("/api/banor", (_, res) => res.json(storage.getAllBanor()));
  app.post("/api/banor", requirePin, (req, res) => {
    const parsed = insertBanaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.status(201).json(storage.createBana(parsed.data));
  });
  app.patch("/api/banor/:id", requirePin, (req, res) => {
    const id = Number(req.params.id);
    const b = storage.updateBanaInfo(id, req.body);
    b ? res.json(b) : res.status(404).json({ error: "Bana hittades inte" });
  });

  // Rundor
  app.get("/api/rundor", (_, res) => res.json(storage.getAllRundor()));
  app.get("/api/rundor/golfare/:id", (req, res) =>
    res.json(storage.getRundorByGolfare(Number(req.params.id))));
  app.post("/api/rundor", requirePin, (req, res) => {
    const parsed = insertRundaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.status(201).json(storage.createRunda(parsed.data));
  });

  // Tävlingar
  app.get("/api/tavlingar", (_, res) => res.json(storage.getAllTavlingar()));
  app.get("/api/tavlingar/:id", (req, res) => {
    const t = storage.getTavlingById(Number(req.params.id));
    t ? res.json(t) : res.status(404).json({ error: "Tävling hittades inte" });
  });
  app.post("/api/tavlingar", requirePin, (req, res) => {
    const parsed = insertTavlingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.status(201).json(storage.createTavling(parsed.data));
  });
  app.patch("/api/tavlingar/:id", requirePin, (req, res) => {
    const t = storage.updateTavling(Number(req.params.id), req.body);
    t ? res.json(t) : res.status(404).json({ error: "Tävling hittades inte" });
  });
  app.delete("/api/tavlingar/:id", requirePin, (req, res) => {
    const deleted = storage.deleteTavling(Number(req.params.id));
    deleted ? res.status(204).send() : res.status(404).json({ error: "Tävling hittades inte" });
  });

  // Tävlingsresultat
  app.get("/api/tavlingar/:id/resultat", (req, res) =>
    res.json(storage.getResultatByTavling(Number(req.params.id))));
  app.post("/api/tavlingsresultat", requirePin, (req, res) => {
    const parsed = insertTavlingsresultatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.status(201).json(storage.createResultat(parsed.data));
  });
  app.delete("/api/tavlingsresultat/:id", requirePin, (req, res) => {
    const deleted = storage.deleteResultat(Number(req.params.id));
    deleted ? res.status(204).send() : res.status(404).json({ error: "Resultat hittades inte" });
  });

  // Bulk-spara alla resultat för en tävling (ersätter befintliga)
  app.post("/api/tavlingar/:id/resultat/bulk", requirePin, (req, res) => {
    const tavlingId = Number(req.params.id);
    const { resultat } = req.body as { resultat: Array<any> };
    if (!Array.isArray(resultat)) return res.status(400).json({ error: "resultat måste vara en array" });
    const saved = storage.bulkSaveResultat(tavlingId, resultat);
    res.status(201).json(saved);
  });
  app.delete("/api/tavlingar/:id/resultat", requirePin, (req, res) => {
    const tavlingId = Number(req.params.id);
    const deletedCount = storage.clearResultatByTavling(tavlingId);
    res.json({ deletedCount });
  });

  // Reportage
  app.get("/api/reportage", (_, res) => res.json(storage.getAllReportage()));
  app.get("/api/reportage/:id", (req, res) => {
    const r = storage.getReportageById(Number(req.params.id));
    r ? res.json(r) : res.status(404).json({ error: "Reportage hittades inte" });
  });
  app.post("/api/reportage", requirePin, (req, res) => {
    const parsed = insertReportageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.status(201).json(storage.createReportage(parsed.data));
  });

  // Order of Merit
  app.get("/api/order-of-merit", (_, res) => res.json(storage.getOrderOfMerit()));

  return httpServer;
}
