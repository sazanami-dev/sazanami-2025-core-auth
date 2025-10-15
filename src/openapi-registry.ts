import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

class OpenAPIRegistrySingleton {
  private static instance: OpenAPIRegistry;
  private constructor() { }
  public static getInstance(): OpenAPIRegistry {
    if (!OpenAPIRegistrySingleton.instance) {
      OpenAPIRegistrySingleton.instance = new OpenAPIRegistry();
    }
    return OpenAPIRegistrySingleton.instance;
  }
}

export const registry = OpenAPIRegistrySingleton.getInstance();
