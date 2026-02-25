import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { asyncHandler } from "../middleware/async-handler.js";

const createLeadSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
  source: z.string().optional()
});

export const leadsRouter = Router();

leadsRouter.get("/leads", asyncHandler(async (_req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  res.json(leads);
}));

leadsRouter.post("/leads", asyncHandler(async (req, res) => {
  const payload = createLeadSchema.parse(req.body);
  const lead = await prisma.lead.create({
    data: {
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      message: payload.message,
      source: payload.source ?? "landing"
    }
  });
  res.status(201).json(lead);
}));
