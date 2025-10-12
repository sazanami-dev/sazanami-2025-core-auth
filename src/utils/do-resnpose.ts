import { Response } from 'express';
import { ZodSchema } from 'zod';

// TODO: デフォルトのステータスコードを200にするのをやめる
// (明示的に200を指定していてもデフォルト扱いされてしまうため)

/**
 * Utility class to manage Express responses with a chainable API.
 *   DoResponse.init(res).status(201).json({ ... }).send();
 */
export class DoResponse {
  /**
   * Initializes the DoResponse utility with an Express Response object.
   * @param res - The Express Response object to use for sending the response.
   * @returns Returns the class itself for chaining.
   */
  static init(res: Response): {
    ok(): any;
    created(): any;
    internalServerError(): any;
    badRequest(): any;
    unauthorized(): any;
    forbidden(): any;
    notFound(): any;
    conflict(): any;
    redirect(location: string, code?: 301 | 302 | 303 | 307 | 308): any;
    status(code: number): any;
    json(data: any): any;
    validatedJson(data: any, schema: ZodSchema): any;
    error(error: Error): any;
    errorMessage(message: string): any;
    send(): void;
  } {
    let statusCode: number = 200;
    let responseData: any = null;

    let redirectLocation: string | undefined;
    let redirectStatus: 301 | 302 | 303 | 307 | 308 | undefined;

    const api = {
      /**
       * Sets a 200 OK response with a default message.
       * @returns Returns the class itself for chaining.
       */
      ok() {
        return api.status(200).json({ message: 'OK' });
      },

      /**
       * Sets a 201 Created response with a default message.
       * @returns Returns the class itself for chaining.
       */
      created() {
        return api.status(201).json({ message: 'Created' });
      },

      /**
       * Sets a 500 Internal Server Error response with a default message.
       * @returns Returns the class itself for chaining.
       */
      internalServerError() {
        return api
          .status(500)
          .json({ code: 'INTERNAL_SERVER_ERROR', message: 'サーバー内部でエラーが発生しました' });
      },

      /**
       * Sets a 400 Bad Request response with a default message.
       * @returns Returns the class itself for chaining.
       */
      badRequest() {
        return api.status(400).json({ code: 'BAD_REQUEST', message: 'リクエストが不正です' });
      },

      /**
       * Sets a 401 Unauthorized response with a default message.
       * @returns Returns the class itself for chaining.
       */
      unauthorized() {
        return api.status(401).json({ code: 'UNAUTHORIZED', message: '認証が必要です' });
      },

      /**
       * Sets a 403 Forbidden response with a default message.
       * @returns Returns the class itself for chaining.
       */
      forbidden() {
        return api.status(403).json({ code: 'FORBIDDEN', message: 'アクセスが拒否されました' });
      },

      /**
       * Sets a 404 Not Found response with a default message.
       * @returns Returns the class itself for chaining.
       */
      notFound() {
        return api.status(404).json({ code: 'NOT_FOUND', message: 'リソースが見つかりません' });
      },

      /**
       * Sets a 409 Conflict response with a default message.
       * @returns Returns the class itself for chaining.
       */
      conflict() {
        return api.status(409).json({ code: 'CONFLICT', message: 'リクエストが競合しています' });
      },

      /**
       * Set a Redirect response with a Location header.
       * ※ 即座に res.redirect はせず、send() 時に一度だけ送ります。
       * @param location - The URL to redirect to.
       * @param code - Redirect HTTP status (default: 302)
       * @return Returns the class itself for chaining.
       */
      redirect(location: string, code: 301 | 302 | 303 | 307 | 308 = 302) {
        redirectLocation = location;
        redirectStatus = code;
        return api;
      },

      /**
       * Sets the HTTP status code for the response.
       * @param code - The HTTP status code to set.
       * @returns Returns the class itself for chaining.
       */
      status(code: number) {
        statusCode = code;
        return api;
      },

      /**
       * Sets the data to be sent as a JSON response.
       * @param data - The data to include in the JSON response.
       * @returns Returns the class itself for chaining.
       */
      json(data: any) {
        responseData = data;
        return api;
      },

      /**
       * Validates the data using a Zod schema and sets it as the JSON response.
       * If validation fails, it sets a 500 Internal Server Error response.
       * @param data - The data to validate and include in the response.
       * @param schema - The Zod schema to validate against.
       * @returns Returns the class itself for chaining.
       */
      validatedJson(data: any, schema: ZodSchema) {
        try {
          schema.parse(data);
        } catch (error) {
          console.error('Validation error:', error);
          return api.internalServerError();
        }
        return api.json(data);
      },

      /**
       * Sets an error response with the error's name, message, and optionally a code.
       * @param error - The error object to include in the response (can be Error or ErrorWithCode).
       * @returns Returns the class itself for chaining.
       */
      error(error: Error) {
        let sc = statusCode;
        if (sc === 200) {
          sc = 500; // Default to 500 if status code is not set
        }
        return api.json({ name: error.name, message: error.message }).status(sc);
      },

      /**
       * Sets an error response with a custom message.
       * @param message - The custom error message.
       * @returns Returns the class itself for chaining.
       */
      errorMessage(message: string) {
        let sc = statusCode;
        if (sc === 200) {
          sc = 500; // Default to 500 if status code is not set
        }
        return api
          .json({ code: 'UNKNOWN_ERROR_WITH_SPECIFIC_MESSAGE', message })
          .status(sc);
      },

      /**
       * Sends the response to the client.
       * This method finalizes the response and should be called after setting status and data.
       */
      send() {
        if (res.headersSent) return;

        if (redirectLocation) {
          res.redirect(redirectStatus ?? 302, redirectLocation);
          return;
        }

        res.status(statusCode).json(responseData);
      },
    };

    return api;
  }
}
