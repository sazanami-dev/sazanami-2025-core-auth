import { Router } from "express";
import prisma from "@/prisma";

const router = Router();

router.get("/", (req, res) => {
  const page = parseInt(String(req.query.page || "1"));
  const pageSize = parseInt(String(req.query.pageSize || "20"));
  const skip = (page - 1) * pageSize;

  // WONTFIX: 自作ページネーションやめるべき
  prisma.pendingRedirect.findMany({
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: pageSize,
  })
    .then(async (redirects) => {
      const totalCount = await prisma.pendingRedirect.count();
      res.json({
        data: redirects,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch pending redirects." });
    });
});

export default router;
