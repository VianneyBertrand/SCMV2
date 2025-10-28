"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      className="-ml-2 mb-2 gap-2 text-sm"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </Button>
  )
}
