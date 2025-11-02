import FloatingBubbles from "@/components/floating-bubble"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"
import { useState } from "react"

export default function InitializePage() {
  // クエリパラメータの取得
  const token = new URLSearchParams(window.location.search).get("token") || ""

  // debug(reactive state)
  const isWaitingVerify = useState<boolean>(true)
  const isVaidToken = useState<boolean>(false)

  // 1 Verity token with api call (POST)
  // Workaround
  const API_BASE_URL = "http://localhost:3000"
  fetch(`${API_BASE_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      // Handle response (e.g., show error if invalid)
      if (data.valid) {
        isVaidToken[1](true)
      } else {
        isVaidToken[1](false)
      }
    })
    .catch((error) => {
      console.error("Error verifying token:", error)
      isWaitingVerify[1](false)
    })


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
        isWaitingVerify: {isWaitingVerify[0] ? "true" : "false"}
        <br />
        isVaidToken: {isVaidToken[0] ? "true" : "false"}
      </div>
    </div>
  </>
}
