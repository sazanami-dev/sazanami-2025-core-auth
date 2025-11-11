import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useState } from "react";
import { PiSealWarningDuotone } from "react-icons/pi";

export default function ReauthPage() {

  const [regCode, setRegCode] = useState<string>("");

  const redirectToInitialize = (regCode: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.pathname = '/initialize';
    currentUrl.searchParams.set('regCode', regCode);
    window.location.href = currentUrl.toString();

  }

  return <>
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center mb-8">
        <PiSealWarningDuotone className="text-6xl text-yellow-500" />
        <h1 className="text-3xl my-4">認証が必要です</h1>
      </div>
      <div className="w-full max-w-xl flex flex-col justify-center">
        <Accordion>
          <AccordionItem
            key="with-card"
            aria-label="カードを使用して認証(登録/ログイン)する"
            title="カードを使用して認証(登録/ログイン)する"
          >
            {/* <p>スキャン後、自動で処理を継続します</p> */}
            <h1 className="font-semibold text-xl">まだログインカードを持っていない場合</h1>
            <div className="mt-2 mb-4 ml-4">
              <p><span className="font-semibold">さざなみ開発が出展するブース</span>や<span className="font-semibold">一部のチェックポイントポスター</span>に設置されている"ログインカード"を1枚取り、カードに貼り付けられているQRコードをスキャンしてください。</p>
              <p>15分以内であれば自動で処理を継続します</p>
              <div className="flex flex-row justify-center my-4">
                <p className="text-sm text-gray-600">※</p>
                <p className="text-sm text-gray-600">スキャンまでに時間が空きすぎた場合、連携先システムで処理がキャンセルされることがあります。<br />エラーが発生した場合はスキャン後再度操作を行ってみてください。</p>
              </div>
            </div>
            <h1 className="font-semibold text-xl">すでにカードを持っている場合</h1>
            <div className="mt-2 mb-4 ml-4">
              <p>QRコードをスキャンすることでログインすることができます</p>
              <p>カードに貼り付けられているQRコードをスキャンしてください。</p>
              <p>自動で処理を継続します。</p>
            </div>
            <p className="text-gray-600 mt-3">※ 必ず<span className="font-semibold">このブラウザ</span>でQRコードを処理してください。</p>
          </AccordionItem>
          <AccordionItem
            key="regist-without-card"
            aria-label="カードを使用せずに登録する"
            title="カードを使用せずに登録する"
          >
            <p>下のボタンから登録を行ってください。</p>
            <div className="flex justify-center mt-4">
              <Button
                className="w-md mt-5"
                color="primary"
                variant="shadow"
              >登録ページ</Button>
            </div>
          </AccordionItem>
          <AccordionItem
            key="login-without-card"
            aria-label="コードを入力してログインする"
            title="コードを入力してログインする"
          >
            <p>登録時に表示されたコード、もしくはQRコード付近に記載されたコードを以下に入力してください。</p>
            <Input
              className="mt-4"
              type="text"
              variant="bordered"
              label="ログインコード"
              placeholder="XXXXXXXX"
              onChange={(e) => setRegCode(e.target.value)}
            ></Input>
            <div className="flex justify-center mt-4">
              <Button
                className="w-md mt-5"
                color="primary"
                variant="shadow"
                onPress={() => {
                  redirectToInitialize(regCode);
                }}
              >ログインする</Button>
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </>
}
