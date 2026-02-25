import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { asyncHandler } from "../middleware/async-handler.js";

const createTvContentSchema = z.object({
  screenKey: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(["image", "video", "text"]),
  url: z.string().url(),
  durationSec: z.number().int().positive().max(120).optional(),
  orderIndex: z.number().int().optional()
});

export const tvRouter = Router();

tvRouter.get("/tv/:screenKey", asyncHandler(async (req, res) => {
  const screenKeyParam = req.params.screenKey;
  const screenKey = Array.isArray(screenKeyParam) ? screenKeyParam[0] : screenKeyParam;

  if (!screenKey) {
    res.status(400).json({ error: "screenKey is required" });
    return;
  }

  const contents = await prisma.tvContent.findMany({
    where: { screenKey, active: true },
    orderBy: { orderIndex: "asc" }
  });
  res.json(contents);
}));

tvRouter.post("/tv", asyncHandler(async (req, res) => {
  const payload = createTvContentSchema.parse(req.body);
  const content = await prisma.tvContent.create({
    data: {
      ...payload,
      durationSec: payload.durationSec ?? 10,
      orderIndex: payload.orderIndex ?? 0
    }
  });
  res.status(201).json(content);
}));
