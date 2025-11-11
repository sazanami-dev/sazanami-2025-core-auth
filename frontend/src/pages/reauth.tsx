import { Accordion, AccordionItem } from "@heroui/accordion";
import { PiSealWarningDuotone } from "react-icons/pi";

export default function ReauthPage() {
  return <>
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center mb-8">
        <PiSealWarningDuotone className="text-6xl text-yellow-500" />
        <h1 className="text-3xl my-4">認証が必要です</h1>
      </div>
      <div className="w-full max-w-md flex flex-col justify-center">
        <Accordion>
          <AccordionItem
            key="with-card"
            aria-label="カードを使用して認証する"
            title="カードを使用して認証する"
          >
            ここに説明 1
          </AccordionItem>
          <AccordionItem
            key="without-card"
            aria-label="カードを使用せずに認証する"
            title="カードを使用せずに認証する"
          >
            ここに説明 2
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </>
}
