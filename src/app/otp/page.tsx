"use client"

import { useState } from "react"
import { OTPForm } from "@/components/otp-form"

export default function OTPPage() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    setIsLoading(true)
    // TODO: Implement OTP verification logic
    console.log("OTP submitted:", code)
    setIsLoading(false)
  }

  const handleResend = () => {
    // TODO: Implement OTP resend logic
    console.log("OTP resend requested")
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <OTPForm
          code={code}
          onCodeChange={setCode}
          onSubmit={handleSubmit}
          onResend={handleResend}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
