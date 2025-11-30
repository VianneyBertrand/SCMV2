import { create } from 'zustand'

export interface MonthYear {
  month: number
  year: number
}

export interface PeriodState {
  from: MonthYear
  to: MonthYear
}

interface PeriodStore {
  period: PeriodState
  setPeriod: (period: { from?: MonthYear; to?: MonthYear }) => void
}

export const usePeriodStore = create<PeriodStore>((set) => ({
  period: {
    from: { month: 11, year: 2024 }, // 01/12/2024
    to: { month: 11, year: 2025 }    // 01/12/2025
  },
  setPeriod: (newPeriod) => set((state) => ({
    period: {
      from: newPeriod.from ?? state.period.from,
      to: newPeriod.to ?? state.period.to
    }
  }))
}))
