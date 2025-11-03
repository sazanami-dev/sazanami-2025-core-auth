import { Router } from "express";
import prisma from "@/prisma";

const router = Router();

router.get("/", (req, res) => {
  const page = parseInt(String(req.query.page || "1"));
  const pageSize = parseInt(String(req.query.pageSize || "20"));
  const skip = (page - 1) * pageSize;

  // WONTFIX: 自作ページネーションやめるべき
  prisma.user.findMany({
    orderBy: { id: "asc" },
    skip: skip,
    take: pageSize,
  })
    .then(async (users) => {
      const totalCount = await prisma.user.count();
      res.json({
        data: users,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalCount,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch users." });
    });
});

router.get("/:id", (req, res) => {
  const userId = req.params.id;
  prisma.user.findUnique({
    where: { id: userId },
  })
    .then((user) => {
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found." });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to fetch user." });
    });
});

router.delete("/:id", (req, res) => {
  const userId = req.params.id;
  prisma.user.delete({
    where: { id: userId },
  })
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to delete user." });
    });
});

router.put("/:id", (req, res) => {
  const userId = req.params.id;
  const { isInitialized, displayName } = req.body;
  prisma.user.update({
    where: { id: userId },
    data: { isInitialized, displayName },
  })
    .then((user) => {
      res.json(user);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to update user." });
    });
});

router.post("/", (req, res) => {
  const { id, displayName, isInitialized } = req.body;
  prisma.user.create({
    data: {
      id: id || undefined,
      displayName,
      isInitialized
    },
  })
    .then((user) => {
      res.status(201).json(user);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to create user." });
    });
});

export default router;
