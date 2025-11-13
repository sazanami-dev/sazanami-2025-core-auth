import { Router } from "express";
import { sendJson } from "./helpers";

const router = Router();

const modelDefinitions = [
  {
    key: "user",
    label: "Users",
    description: "Basic user records",
    path: "/manage/api/user",
    primaryKey: "id",
    allowManualPrimaryKey: true,
    pageSize: 20,
    columns: [
      { key: "id", label: "ID" },
      { key: "displayName", label: "Display Name" },
      { key: "isInitialized", label: "Initialized", format: "boolean" },
    ],
    fields: [
      { key: "id", label: "ID", type: "text", readOnly: true },
      { key: "displayName", label: "Display Name", type: "text" },
      { key: "isInitialized", label: "Initialized", type: "checkbox" },
    ],
  },
  {
    key: "registrationCode",
    label: "Registration Codes",
    description: "Pending registration codes",
    path: "/manage/api/regCode",
    primaryKey: "code",
    allowManualPrimaryKey: true,
    pageSize: 20,
    columns: [
      { key: "code", label: "Code" },
      { key: "userId", label: "User ID" },
      { key: "createdAt", label: "Created", format: "datetime" },
    ],
    fields: [
      { key: "code", label: "Code", type: "text", readOnly: true },
      { key: "userId", label: "User ID", type: "text" },
      { key: "createdAt", label: "Created", type: "text", readOnly: true },
    ],
  },
  {
    key: "session",
    label: "Sessions",
    description: "Active login sessions",
    path: "/manage/api/session",
    primaryKey: "id",
    allowManualPrimaryKey: true,
    pageSize: 20,
    columns: [
      { key: "id", label: "ID" },
      { key: "userId", label: "User ID" },
      { key: "createdAt", label: "Created", format: "datetime" },
    ],
    fields: [
      { key: "id", label: "ID", type: "text", readOnly: true },
      { key: "userId", label: "User ID", type: "text" },
      { key: "createdAt", label: "Created", type: "text", readOnly: true },
    ],
  },
  {
    key: "pendingRedirect",
    label: "Pending Redirects",
    description: "Redirect intents awaiting completion",
    path: "/manage/api/pending-redirect",
    primaryKey: "id",
    allowManualPrimaryKey: true,
    pageSize: 20,
    columns: [
      { key: "id", label: "ID" },
      { key: "redirectUrl", label: "Redirect URL" },
      { key: "used", label: "Used", format: "boolean" },
      { key: "expiresAt", label: "Expires", format: "datetime" },
      { key: "createdAt", label: "Created", format: "datetime" },
    ],
    fields: [
      { key: "id", label: "ID", type: "text", readOnly: true },
      { key: "redirectUrl", label: "Redirect URL", type: "text" },
      { key: "postbackUrl", label: "Postback URL", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "used", label: "Used", type: "checkbox" },
      { key: "expiresAt", label: "Expires", type: "datetime" },
      { key: "sessionId", label: "Session ID", type: "text" },
      { key: "createdAt", label: "Created", type: "text", readOnly: true },
    ],
  },
];

router.get("/", (_req, res) => {
  return sendJson(res, {
    models: modelDefinitions,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
