import FloatingBubbles from "@/components/floating-bubble"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"
import { useEffect, useState } from "react"
import { VerifyResponseSchema } from "@/types/api/verify"
import { TokenClaims } from "@/types/tokenClaims"
import useApi from "@/hooks/useApi"

export default function InitializePage() {

  const token = new URLSearchParams(window.location.search).get("token") || ""
  const [claims, setClaims] = useState<TokenClaims | null>(null)
  const [isWaitingVerify, setWaitingVerify] = useState<boolean>(true)
  const [isVaidToken, setVaidToken] = useState<boolean>(false)

  useEffect(() => {
    const api = useApi(token)
    // Call verify function
    verifyToken(api, token).then(() => {
      if (isWaitingVerify) {
        setWaitingVerify(false)
      }
    });
  }, [token])

  async function verifyToken(api: ReturnType<typeof useApi>, token: string) {
    return api.post('/verify', { token })
      .then((response) => {
        console.log("Verify response data:", response.data)
        const parsed = VerifyResponseSchema.safeParse(response.data)
        if (parsed.success) {
          setVaidToken(parsed.data.valid)
          if (parsed.data.valid && parsed.data.payload) {
            setClaims(parsed.data.payload)
          }
        } else {
          console.error("Invalid response schema:", parsed.error)
        }
      })
      .catch((error) => {
        console.error("Error verifying token:", error)
      })
  }

  async function activateUser(api: ReturnType<typeof useApi>, username: string) {
    return api.post('/activate', { displayName: username })
      .then((response) => {
        console.log("Activate response data:", response.data)
      });
  }


  return <>
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <FloatingBubbles />
      <div className="flex flex-col items-center py-4 w-full max-w-xl"> {/* Greeting */}
        <p className="text-3xl font-semibold pb-2">ようこそ！</p>
        <p className="text-sm py-1">（ここになにか粋なメッセージがほしい！）</p>
      </div>
      <div className="flex flex-col items-center py-2 w-full max-w-xl"> {/* Form */}
        <Input
          type="text"
          variant="bordered"
          label="ユーザー名"
          placeholder="トライデント太郎"
          // value={username}
          // onChange={(e) => setUsername(e.target.value)}
          classNames={{
            mainWrapper: "w-full",
          }}
        />
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
        <Button className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-full shadow-lg w-full"
        // onClick={() => activateUser(username)}>
        >
          登録
        </Button>
      </div>

      {/* Debug Info */}
      <div className="fixed bottom-0 left-0 w-full text-left text-xs text-gray-500 mb-2 ml-2 pointer-events-none select-none">
        <p className="mb-1">[Debug Info]</p>
        Token: {token || "<none>"}
        <br />
        isWaitingVerify: {isWaitingVerify ? "true" : "false"}
        <br />
        isVaidToken: {isVaidToken ? "true" : "false"}
        <br />
        Claims:
        <ul>
          {claims ? Object.entries(claims).map(([key, value]) => (
            <li key={key} className="pl-2">
              - {key}: {value?.toString() || "<none>"}
            </li>
          )) : "<none>"}
        </ul>
      </div>
    </div>
  </>
}
