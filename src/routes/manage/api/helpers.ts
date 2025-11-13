import { Request, Response } from "express";
import { DoResponse } from "@/utils/do-resnpose";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const getPaginationParams = (req: Request) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const rawPageSize = Number.parseInt(String(req.query.pageSize ?? DEFAULT_PAGE_SIZE), 10);
  const pageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, rawPageSize || DEFAULT_PAGE_SIZE));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
};

export const buildPagination = (page: number, pageSize: number, totalCount: number) => ({
  page,
  pageSize,
  totalPages: Math.ceil(totalCount / pageSize),
  totalCount,
});

export const sendJson = (res: Response, payload: unknown, status = 200) => {
  return DoResponse.init(res).status(status).json(payload).send();
};

export const sendError = (res: Response, status: number, message: string) => {
  return DoResponse.init(res).status(status).errorMessage(message).send();
};

export const sendNoContent = (res: Response) => {
  if (res.headersSent) return;
  res.status(204).end();
};
