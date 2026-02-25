import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { asyncHandler } from "../middleware/async-handler.js";

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().datetime().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

export const patientsRouter = Router();

patientsRouter.get("/patients", asyncHandler(async (_req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    include: { appointments: true }
  });
  res.json(patients);
}));

patientsRouter.post("/patients", asyncHandler(async (req, res) => {
  const payload = createPatientSchema.parse(req.body);
  const patient = await prisma.patient.create({
    data: {
      ...payload,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : undefined
    }
  });
  res.status(201).json(patient);
}));
