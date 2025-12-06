import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

type OTPFormProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
  onResend?: () => void
  isLoading?: boolean
}

export function OTPForm({
  className,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  isLoading,
  ...props
}: OTPFormProps) {
  return (
    <div className={cn("flex flex-col gap-6 md:min-h-[450px]", className)} {...props}>
      <Card className="flex-1 overflow-hidden p-0">
        <CardContent className="grid flex-1 p-0 md:grid-cols-2">
          <form
            className="flex flex-col items-center justify-center p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit()
            }}
          >
            <FieldGroup>
              <Field className="items-center text-center">
                <h1 className="text-2xl font-bold">Verifizierungscode eingeben</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Wir haben einen 6-stelligen Code an deine E-Mail gesendet.
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="otp" className="sr-only">
                  Verifizierungscode
                </FieldLabel>
                <InputOTP
                  maxLength={6}
                  id="otp"
                  value={code}
                  onChange={onCodeChange}
                  required
                  containerClassName="gap-4"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription className="text-center">
                  Gib den 6-stelligen Code ein, um fortzufahren.
                </FieldDescription>
              </Field>
              <Field className="grid gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-b-transparent align-[-0.2em]" />
                  )}
                  Code bestätigen
                </Button>
                {onResend && (
                  <Button type="button" variant="outline" onClick={onResend} disabled={isLoading}>
                    Code erneut senden
                  </Button>
                )}
              </Field>
              <FieldDescription className="text-center text-xs text-muted-foreground">
                Durch Fortfahren stimmst du unseren Nutzungsbedingungen und der Datenschutzrichtlinie zu.
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block">
            <Image
              src="/dashboard-dark.png"
              alt="OTP Illustration"
              fill
              sizes="480px"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
