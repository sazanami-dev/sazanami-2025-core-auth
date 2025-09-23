import { Response } from 'express';
import { ZodSchema } from 'zod';

// TODO: デフォルトのステータスコードを200にするのをやめる
// (明示的に200を指定していてもデフォルト扱いされてしまうため)

/**
 * Utility class to manage Express responses with a chainable API.
 */
export class DoResponse {
  private static res: Response; // Express Response object
  private static statusCode: number = 200; // Default status code
  private static responseData: any = null; // Data to send in the response

  /**
   * Initializes the DoResponse utility with an Express Response object.
   * @param res - The Express Response object to use for sending the response.
   * @returns Returns the class itself for chaining.
   */
  static init(res: Response): typeof DoResponse {
    this.res = res;
    this.statusCode = 200;
    this.responseData = null;
    return this;
  }

  /**
   * Sets a 200 OK response with a default message.
   * @returns Returns the class itself for chaining.
   */
  static ok(): typeof DoResponse {
    return this.status(200).json({ message: 'OK' });
  }

  /**
   * Sets a 201 Created response with a default message.
   * @returns Returns the class itself for chaining.
   */
  static created(): typeof DoResponse {
    return this.status(201).json({ message: 'Created' });
  }

  /**
   * Sets a 500 Internal Server Error response with a default message.
   * @returns Returns the class itself for chaining.
   */
  static internalServerError(): typeof DoResponse {
    return this.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'サーバー内部でエラーが発生しました' });
  }

  /**
   * Sets a 400 Bad Request response with a default message.
   * @returns Returns the class itself for chaining.
   */
  static badRequest(): typeof DoResponse {
    return this.status(400).json({ code: 'BAD_REQUEST', message: 'リクエストが不正です' });
  }

  /**
  * Sets a 401 Unauthorized response with a default message.
  * @returns Returns the class itself for chaining.
  */
  static unauthorized(): typeof DoResponse {
    return this.status(401).json({ code: 'UNAUTHORIZED', message: '認証が必要です' });
  }

  /**
  * Sets a 403 Forbidden response with a default message.
  * @returns Returns the class itself for chaining.
  */
  static forbidden(): typeof DoResponse {
    return this.status(403).json({ code: 'FORBIDDEN', message: 'アクセスが拒否されました' });
  }

  /**
   * Sets a 404 Not Found response with a default message.
   * @returns Returns the class itself for chaining.
   */
  static notFound(): typeof DoResponse {
    return this.status(404).json({ code: 'NOT_FOUND', message: 'リソースが見つかりません' });
  }

  /**
   * Sets a 409 Conflict response with a default message.
   * @returns Returns the class itself for chaining.
   */
  static conflict(): typeof DoResponse {
    return this.status(409).json({ code: 'CONFLICT', message: 'リクエストが競合しています' });
  }

  /**
   * Sets the HTTP status code for the response.
   * @param code - The HTTP status code to set.
   * @returns Returns the class itself for chaining.
   */
  static status(code: number): typeof DoResponse {
    this.statusCode = code;
    return this;
  }

  /**
   * Sets the data to be sent as a JSON response.
   * @param data - The data to include in the JSON response.
   * @returns Returns the class itself for chaining.
   */
  static json(data: any): typeof DoResponse {
    this.responseData = data;
    return this;
  }

  /**
   * Validates the data using a Zod schema and sets it as the JSON response.
   * If validation fails, it sets a 500 Internal Server Error response.
   * @param data - The data to validate and include in the response.
   * @param schema - The Zod schema to validate against.
   * @returns Returns the class itself for chaining.
   */
  static validatedJson(data: any, schema: ZodSchema): typeof DoResponse {
    try {
      schema.parse(data);
    } catch (error) {
      console.error('Validation error:', error);
      return this.internalServerError();
    }
    return this.json(data);
  }

  /**
   * Sets an error response with the error's name, message, and optionally a code.
   * @param error - The error object to include in the response (can be Error or ErrorWithCode).
   * @returns Returns the class itself for chaining.
   */
  static error(error: Error): typeof DoResponse {
    const responseBody: Record<string, string> = {
      name: error.name,
      message: error.message,
    };

    let statusCode = this.statusCode;

    if (statusCode === 200) {
      statusCode = 500; // Default to 500 if status code is not set
    }

    return this.json(responseBody).status(statusCode);
  }

  /**
   * Sets an error response with a custom message.
   * @param message - The custom error message.
   * @returns Returns the class itself for chaining.
   */
  static errorMessage(message: string): typeof DoResponse {
    let statusCode = this.statusCode;

    if (statusCode === 200) {
      statusCode = 500; // Default to 500 if status code is not set
    }
    return this.json({
      code: 'UNKNOWN_ERROR_WITH_SPECIFIC_MESSAGE',
      message,
    }).status(statusCode);
  }

  /**
   * Sends the response to the client.
   * This method finalizes the response and should be called after setting status and data.
   */
  static send(): void {
    if (!this.res.headersSent) {
      this.res.status(this.statusCode).json(this.responseData);
    }
  }
}
