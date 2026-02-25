import { Router } from "express";

const automations = [
  {
    id: "reminder-j-1",
    label: "Rappel rendez-vous J-1",
    status: "ACTIVE",
    channel: "sms-email",
    schedule: "Tous les jours 18:00"
  },
  {
    id: "reminder-h-2",
    label: "Rappel rendez-vous H-2",
    status: "ACTIVE",
    channel: "sms",
    schedule: "2h avant chaque RDV"
  }
];

export const automationsRouter = Router();

automationsRouter.get("/automations", (_req, res) => {
  res.json(automations);
});
