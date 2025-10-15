import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getKey } from "@/key";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { SignKey } from "@/interfaces/SignKey";

const router = Router();

/**
 * @swagger
 * /.well-known/jwks.json:
 *   get:
 *     summary: Retrieve the JSON Web Key Set (JWKS).
     description: Exposes the active signing key so clients can verify issued tokens.
     tags:
       - Public Keys
     responses:
       "200":
         description: JWKS document containing the current signing key.
         content:
           application/json:
             schema:
               type: object
               properties:
                 keys:
                   type: array
                   items:
                     type: object
                     properties:
                       use:
                         type: string
                       alg:
                         type: string
                       kid:
                         type: string
                       kty:
                         type: string
                       e:
                         type: string
                       n:
                         type: string
                       crv:
                         type: string
                       x:
                         type: string
                       y:
                         type: string
                     required:
                       - use
                       - alg
                       - kid
                       - kty
       "500":
         description: Signing key could not be loaded or is unsupported.
         content:
           application/json:
             schema:
               type: object
               properties:
                 message:
                   type: string
               required:
                 - message
             examples:
               loadFailed:
                 summary: Failed to load key
                 value:
                   message: Failed to load key
               unsupported:
                 summary: Unsupported key type
                 value:
                   message: Unsupported key type
 */
router.get('/', async (_req, res) => {
  const signKey: SignKey = await getKey().catch(err => {
    return DoResponse.init(res).internalServerError().errorMessage('Failed to load key').send();
  });

  const kid = EnvUtil.get(EnvKey.TOKEN_SIGN_KEY_DEFAULT_KID);

  let jwk: any = {
    use: 'sig',
    alg: signKey.cryptoAlgorithm,
    kid: kid,
  };

  if (signKey.keyType === 'rsa') {
    jwk = {
      ...jwk,
      kty: 'RSA',
      e: signKey.jwk!.e!,
      n: signKey.jwk!.n!,
    };
  } else if (signKey.keyType === 'ec') {
    jwk = {
      ...jwk,
      kty: 'EC',
      crv: signKey.jwk!.crv!,
      x: signKey.jwk!.x!,
      y: signKey.jwk!.y!,
    };
  } else {
    return DoResponse.init(res).internalServerError().errorMessage('Unsupported key type').send();
  }

  return DoResponse.init(res).ok().json({
    keys: [jwk],
  }).send();
});

export default router;
