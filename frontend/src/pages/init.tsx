import DefaultLayout from "@/layouts/default"
import FloatingBubbles from "@/components/floating-bubble"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"

export default function InitializePage() {
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
    </div>
  </>
}
