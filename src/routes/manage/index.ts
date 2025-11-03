import { Router } from "express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./api/index.js";

const router = Router();

router.use("/api", apiRouter);

// Provide ./public as static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
router.use(express.static(path.join(__dirname, "public")));

export default router;
