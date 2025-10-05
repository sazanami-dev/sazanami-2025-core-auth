import { Response } from "express";
import { DoResponse } from "@utils/do-resnpose";
import { expect, test, describe, beforeAll, beforeEach, vitest } from 'vitest'

describe("DoResponse", () => {
  let res: Response

  beforeEach(() => {
    // setup mock
    res = {
      status: vitest.fn().mockReturnThis(),
      json: vitest.fn(),
    } as unknown as Response; // 型を合致させるのは大変すぎるので
  });

  describe("init", () => {
    test("受け取ったResponseオブジェクトと初期値が正しく設定される", () => {
      const instance = DoResponse.init(res);
      // privateにアクセスするため
      expect((instance as any).res).toBe(res);
      expect((instance as any).statusCode).toBe(200);
      expect((instance as any).responseData).toBeNull();
    });
  });

  describe("ok()", () => {
    let instance: any;

    beforeEach(() => {
      instance = DoResponse.init(res).ok();
    });

    test("statusが200に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(200);
      expect((instance as any).responseData).toEqual({ message: "OK" });
    });

    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("created()", () => {
    let instance: any;

    beforeEach(() => {
      instance = DoResponse.init(res).created();
    });

    test("statusが200に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(201);
      expect((instance as any).responseData).toEqual({ message: "Created" });
    });

    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("internalServerError()", () => {
    let instance: any;

    beforeEach(() => {
      instance = DoResponse.init(res).internalServerError();
    });

    test("statusが500に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(500);
      expect((instance as any).responseData).toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    });

    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("badRequest()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).badRequest();
    });
    test("statusが400に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(400);
      expect((instance as any).responseData).toMatchObject({ code: "BAD_REQUEST" });
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("unauthorized()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).unauthorized();
    });
    test("statusが401に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(401);
      expect((instance as any).responseData).toMatchObject({ code: "UNAUTHORIZED" });
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("forbidden()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).forbidden();
    });
    test("statusが403に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(403);
      expect((instance as any).responseData).toMatchObject({ code: "FORBIDDEN" });
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("notFound()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).notFound();
    });
    test("statusが404に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(404);
      expect((instance as any).responseData).toMatchObject({ code: "NOT_FOUND" });
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("conflict()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).conflict();
    });
    test("statusが409に, bodyがデフォルトメッセージで上書きされる", () => {
      expect((instance as any).statusCode).toBe(409);
      expect((instance as any).responseData).toMatchObject({ code: "CONFLICT" });
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("json()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).ok().json({ message: "test" });
    });
    test("bodyが引数で上書きされる", () => {
      expect((instance as any).responseData).toEqual({ message: "test" });
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("status()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).status(404);
    });
    test("statusが引数で上書きされる", () => {
      expect((instance as any).statusCode).toBe(404);
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // TODO: バリデーション(validatedJson())のテストを追加

  describe("error()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res);
    });
    test("Errorの場合、name, messageをbodyに含む", () => {
      instance.error(new Error("test"));
      expect((instance as any).responseData).toMatchObject({ name: "Error", message: "test" });
    });
    test("statusが500に書き換えられる", () => {
      instance.error(new Error("test"));
      expect((instance as any).statusCode).toBe(500);
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("errorMessage()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).errorMessage("test");
    });
    test("messageをbodyに含む", () => {
      expect((instance as any).responseData).toMatchObject({ code: "UNKNOWN_ERROR_WITH_SPECIFIC_MESSAGE", message: "test" });
    });
    test("statusが200に書き換えられる", () => {
      expect((instance as any).statusCode).toBe(500);
    });
    test("sendがcallされるまでレスポンスを送信しない", () => {
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("send()", () => {
    let instance: any;
    beforeEach(() => {
      instance = DoResponse.init(res).ok();
    });
    test("statusとbodyをレスポンスに送信する", () => {
      instance.send();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "OK" });
    });
  });
});
