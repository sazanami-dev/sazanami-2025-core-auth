import { useEffect, useState } from "react";
import { PiSealWarningDuotone, PiChatCenteredTextDuotone, PiCodeDuotone } from "react-icons/pi";

export default function ErrorPage() {
  // Get error info from URL params
  const params = new URLSearchParams(window.location.search);

  const [errorMessage, setErrorMessage] = useState<string | null>("不明なエラーが発生しました");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>("PLACEHOLDER_ERR");

  useEffect(() => {
    if (!params.get("code")) {
      setErrorCode("ERROR_DETAIL_NOT_PROVIDED");
      setErrorMessage("不明なエラーが発生しました");
      setErrorDetail("エラー情報は正しく提供されませんでした。");
    } else {
      setErrorCode(params.get("code"));
      if (params.get("message")) {
        setErrorMessage(params.get("message"));
      } else {
        setErrorMessage(null);
      }
      if (params.get("detail")) {
        setErrorDetail(params.get("detail"));
      } else {
        setErrorDetail(null);
      }
    }
  });

  return <>
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <PiSealWarningDuotone className="text-6xl text-red-400 mb-4" />
      <div className="flex flex-col items-center py-4 w-full max-w-xl text-center">
        <p className="text-3xl pb-2">エラーが発生しました</p>
        {errorMessage && <p className="text-lg font-medium text-amber-600 pb-2">{errorMessage}</p>}
        <div className="mt-4 p-4 w-full bg-gray-100 rounded-lg text-left shadow-sm flex flex-col overflow-x-scroll" >
          {errorCode && (
            <div className="flex items-center gap-x-2 mb-3">
              <PiCodeDuotone className="text-xl text-gray-500 flex-shrink-0" />
              <p className="text-gray-700 flex-1 min-w-0 break-all">
                {errorCode}
              </p>
            </div>
          )}

          {errorDetail && (
            <div className="flex items-center gap-x-2">
              <PiChatCenteredTextDuotone className="text-xl text-gray-500 flex-shrink-0" />
              <p className="text-gray-700 flex-1 min-w-0 break-all">
                {errorDetail}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </>

}
