import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { PiSealWarningDuotone } from "react-icons/pi";

export default function ReauthPage() {
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
            aria-label="カードを使用して認証する"
            title="カードを使用して認証する"
          >
            <p><span className="font-semibold">さざなみ開発が出展するブース</span>や<span className="font-semibold">一部のチェックポイントポスター</span>に設置されている"ログインカード"を1枚取り、カードに貼り付けられているQRコードをスキャンしてください。</p>
            <p>スキャン後、自動で処理を継続します</p>
            <p className="text-gray-600 mt-3">※ 必ず<span className="font-semibold">このブラウザ</span>でQRコードを処理してください。</p>
          </AccordionItem>
          <AccordionItem
            key="without-card"
            aria-label="カードを使用せずに認証する"
            title="カードを使用せずに認証する"
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
        </Accordion>
      </div>
    </div>
  </>
}
