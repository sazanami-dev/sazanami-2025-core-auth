import { Router } from "express";
import { verifyToken } from "@/services/auth/token";

const router = Router();

/**
 * @swagger
 * /verify:
 *   post:
 *     summary: Validate a token issued by the authentication service.
     description: >
       Verifies the provided token using the current signing key and returns whether it is valid.
       When valid, the decoded payload is returned for inspection.
     tags:
       - Authentication
     requestBody:
       required: true
       content:
         application/json:
           schema:
             type: object
             properties:
               token:
                 type: string
             required:
               - token
     responses:
       "200":
         description: Verification result.
         content:
           application/json:
             schema:
               oneOf:
                 - type: object
                   properties:
                     valid:
                       type: boolean
                       const: true
                     payload:
                       type: object
                       description: Claims contained in the token.
                   required:
                     - valid
                     - payload
                 - type: object
                   properties:
                     valid:
                       type: boolean
                       const: false
                   required:
                     - valid
             examples:
               validToken:
                 summary: Valid token
                 value:
                   valid: true
                   payload:
                     sub: example-user-id
                     iat: 1720000000
               invalidToken:
                 summary: Invalid token
                 value:
                   valid: false
       "400":
         description: Token was not provided.
         content:
           application/json:
             schema:
               type: object
               properties:
                 error:
                   type: string
               required:
                 - error
             example:
               error: Token is required
 */
router.post("/", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const verified = await verifyToken(token);
  if (verified) {
    return res.status(200).json({ valid: true, payload: verified });
  } else {
    return res.status(200).json({ valid: false });
  }
});

export default router;
