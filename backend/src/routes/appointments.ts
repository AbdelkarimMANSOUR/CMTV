import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { asyncHandler } from "../middleware/async-handler.js";

const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  startsAt: z.string().datetime(),
  reason: z.string().optional(),
  status: z.string().optional()
});

export const appointmentsRouter = Router();

appointmentsRouter.get("/appointments", asyncHandler(async (_req, res) => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { startsAt: "asc" },
    include: { patient: true }
  });
  res.json(appointments);
}));

appointmentsRouter.post("/appointments", asyncHandler(async (req, res) => {
  const payload = createAppointmentSchema.parse(req.body);
  const appointment = await prisma.appointment.create({
    data: {
      patientId: payload.patientId,
      startsAt: new Date(payload.startsAt),
      reason: payload.reason,
      status: payload.status ?? "SCHEDULED"
    }
  });
  res.status(201).json(appointment);
}));
