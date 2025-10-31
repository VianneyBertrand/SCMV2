// @ts-nocheck
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface PeriodFilterProps {
  defaultFrom?: Date
  defaultTo?: Date
  onDateChange?: (range: DateRange | undefined) => void
}

export function PeriodFilter({
  defaultFrom = new Date(2024, 11, 11),
  defaultTo = new Date(2024, 11, 14),
  onDateChange
}: PeriodFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: defaultFrom,
    to: defaultTo,
  })

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range)
    onDateChange?.(range)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Sélectionner une période"

    const from = format(dateRange.from, "dd/MM/yyyy")
    const to = dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : from

    return `${from} - ${to}`
  }

  return (
    <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-gray-700">Période</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-auto justify-between border-gray-200 bg-white font-normal shadow-none gap-2"
            >
              {formatDateRange()}
              <CalendarIcon className="h-4 w-4 text-blue" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  )
}
