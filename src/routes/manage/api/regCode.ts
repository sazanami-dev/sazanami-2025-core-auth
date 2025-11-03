import { Router } from "express";
import prisma from "@/prisma";

const router = Router();

router.get("/", (req, res) => {
  const page = parseInt(String(req.query.page || "1"));
  const pageSize = parseInt(String(req.query.pageSize || "20"));
  const skip = (page - 1) * pageSize;

  // WONTFIX: 自作ページネーションやめるべき
  prisma.registrationCode.findMany({
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: pageSize,
  })
    .then(async (codes) => {
      const totalCount = await prisma.registrationCode.count();
      res.json({
        data: codes,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch registration codes." });
    });
});

router.get("/:id", (req, res) => {
  const code = req.params.id
  prisma.registrationCode.findUnique({
    where: { code: code },
  })
    .then((code) => {
      if (code) {
        res.json(code);
      } else {
        res.status(404).json({ error: "Registration code not found." });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch registration code." });
    });
});

router.delete("/:id", (req, res) => {
  const code = req.params.id;
  prisma.registrationCode.delete({
    where: { code: code },
  })
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to delete registration code." });
    });
});

router.post("/", (req, res) => {
  const { code, userId } = req.body;
  prisma.registrationCode.create({
    data: {
      code: code || undefined,
      userId: userId,
    },
  })
    .then((newCode) => {
      res.status(201).json(newCode);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to create registration code." });
    });
});

router.put("/:id", (req, res) => {
  const code = req.params.id;
  const { userId } = req.body;
  prisma.registrationCode.update({
    where: { code: code },
    data: { userId: userId },
  })
    .then((updatedCode) => {
      res.json(updatedCode);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to update registration code." });
    });
});

router.post("/", (req, res) => {
  const { code, userId } = req.body;
  prisma.registrationCode.create({
    data: {
      code: code || undefined,
      userId: userId,
    },
  })
    .then((newCode) => {
      res.status(201).json(newCode);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to create registration code." });
    });
});

export default router;
