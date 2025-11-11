import useApi from "@/hooks/useApi"
import { RegisterResponseSchema } from "@/types/api/register"
import { Button } from "@heroui/button"
import { useMemo, useState } from "react"

export default function RegistPage() {

  const [isIssued, setIssued] = useState<boolean>(false)
  const [regCode, setRegCode] = useState<string>("")
  const api = useMemo(() => useApi(), [])

  const issueRegCode = async () => {
    try {
      const response = await api.post('/register', {})
      const data = RegisterResponseSchema.parse(response.data)

      setRegCode(data.regCode)
      setIssued(true)
    } catch (e) {
      console.error("Failed to issue registration code:", e)
    }
  }
  return <>
    <Button onPress={issueRegCode} disabled={isIssued}>
      {isIssued ? "Registration Code Issued" : "Issue Registration Code"}
    </Button>
  </>
}
