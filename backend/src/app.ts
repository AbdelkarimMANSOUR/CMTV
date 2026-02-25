import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { automationsRouter } from "./routes/automations.js";
import { healthRouter } from "./routes/health.js";
import { leadsRouter } from "./routes/leads.js";
import { patientsRouter } from "./routes/patients.js";
import { tvRouter } from "./routes/tv.js";
import { errorHandler } from "./middleware/error-handler.js";

export const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", healthRouter);
app.use("/api", patientsRouter);
app.use("/api", appointmentsRouter);
app.use("/api", tvRouter);
app.use("/api", leadsRouter);
app.use("/api", automationsRouter);

app.use(errorHandler);
