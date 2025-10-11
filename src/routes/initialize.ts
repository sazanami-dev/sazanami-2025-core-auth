import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";

const router = Router();

router.get('/', async (req, res) => {
  // regCodeを受け取ってユーザー初期化処理を開始する
});

