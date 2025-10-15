import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getKey } from "@/key";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { SignKey } from "@/interfaces/SignKey";

const router = Router();

router.get('/', async (req, res) => {
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
      kty: signKey.cryptoAlgorithm,
      kid: kid,
      e: signKey.jwk!.e!,
      n: signKey.jwk!.n!,
    };
  } else if (signKey.keyType === 'ec') {
    jwk = {
      kty: signKey.cryptoAlgorithm,
      kid: kid,
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
