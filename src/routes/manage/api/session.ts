import { Router } from "express";
import prisma from "@/prisma";

const router = Router();

router.get("/", (req, res) => {
  const page = parseInt(String(req.query.page || "1"));
  const pageSize = parseInt(String(req.query.pageSize || "20"));
  const skip = (page - 1) * pageSize;

  // WONTFIX: 自作ページネーションやめるべき
  prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: pageSize,
  })
    .then(async (sessions) => {
      const totalCount = await prisma.session.count();
      res.json({
        data: sessions,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch sessions." });
    });
});

export default router;
