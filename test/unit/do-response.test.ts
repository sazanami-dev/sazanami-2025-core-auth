import { Response } from "express";
import { DoResponse } from "@utils/do-resnpose";
import { expect, test, describe, beforeEach, vitest } from 'vitest';
import { makeMockRes } from '../helpers/mockRes';

describe("DoResponse", () => {
  let res: Response & {
    status: ReturnType<typeof vitest.fn>;
    json: ReturnType<typeof vitest.fn>;
    redirect: ReturnType<typeof vitest.fn>;
    headersSent: boolean;
  };

  beforeEach(() => {
    res = makeMockRes();
  });

  describe("init", () => {
    test("受け取ったResponseオブジェクトと初期値が正しく設定される", () => {
      const instance = DoResponse.init(res);
      // 初期値は send() の振る舞いで検証（200, null）
      instance.send();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(null);
    });
  });

  describe("ok()", () => {
    let instance: any;

    beforeEach(() => {
      instance = DoResponse.init(res).ok();
    });

    test("statusが200に, bodyがデフォルトメッセージで上書きされる", () => {
      instance.send();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "OK" });
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "Created" });
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }));
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "BAD_REQUEST" }));
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "UNAUTHORIZED" }));
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN" }));
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND" }));
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "CONFLICT" }));
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "test" });
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
      instance.send();
      expect(res.status).toHaveBeenCalledWith(404);
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
      instance.error(new Error("test")).send();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: "Error", message: "test" }));
    });
    test("statusが500に書き換えられる", () => {
      instance.error(new Error("test")).send();
      expect(res.status).toHaveBeenCalledWith(500);
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
      instance.send();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "test",
      }));
    });
    test("statusが500に書き換えられる", () => {
      instance.send();
      expect(res.status).toHaveBeenCalledWith(500);
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
