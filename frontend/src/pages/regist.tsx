import useApi from "@/hooks/useApi"
import { RegisterResponseSchema } from "@/types/api/register"
import { Button } from "@heroui/button"
import { Code } from "@heroui/code";
import { useEffect, useMemo, useState } from "react"

export default function RegistPage() {

  const queryParams = new URLSearchParams(window.location.search)

  const [isIssued, setIssued] = useState<boolean>(false)
  const [regCode, setRegCode] = useState<string>("")
  const api = useMemo(() => useApi(), [])

  const issueRegCode = async () => {
    try {
      const response = await api.post('/register', {})
      const data = RegisterResponseSchema.parse(response.data)

      setRegCode(data.regCode)
      setIssued(true)
      saveToLocalStorage(data.regCode)
    } catch (e) {
      console.error("Failed to issue registration code:", e)
    }
  }

  const saveToLocalStorage = (code: string) => {
    localStorage.setItem("registrationCode", code)
  }

  const loadFromLocalStorage = (): string | null => {
    return localStorage.getItem("registrationCode")
  }

  useEffect(() => {
    if (queryParams.get("debug") === "1") {
      saveToLocalStorage("");
    }
    const existingCode = loadFromLocalStorage()
    if (existingCode) {
      setRegCode(existingCode)
      setIssued(true)
    }

  }, [])

  return <>
    {/* {isIssued && <div> */}
    {/*   <h2>Your Registration Code:</h2> */}
    {/*   <p style={{ fontSize: "24px", fontWeight: "bold" }}>{regCode}</p> */}
    {/*   <p>Please save this code securely. You will need it to register your account.</p> */}
    {/* </div>} */}
    <div className="flex flex-col justify-center items-center min-h-screen w-full">
      <div>
        <h1 className="text-3xl mb-4">アカウントの新規発行</h1>
      </div>
      {/* コードは再ログインや別のデバイスでのログイン時にも必要 */}
      {/* <Button onPress={issueRegCode} disabled={isIssued} className=""> */}
      {/*   {isIssued ? "Registration Code Issued" : "Issue Registration Code"} */}
      {/* </Button> */}
      {isIssued ? (
        <>
          <div className="flex flex-col items-center">
            <p className="text-lg mb-2">登録コードが発行されました。</p>
            <p className="text-sm mb-4">以下のコードを安全に保存してください。再ログインや別のデバイスでのログイン時に必要です。</p>
            <Code
              size="lg"
              color="success">
              {regCode}
            </Code>
          </div>
          <Button
            className="mt-6"
            variant="shadow"
            color="primary"
          >アカウントの初期設定ページへ</Button>
        </>
      ) : (
        <Button onPress={issueRegCode} className="mt-4">
          登録コードを発行する
        </Button>
      )}
    </div>
  </>
}
