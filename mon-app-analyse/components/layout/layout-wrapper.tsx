// @ts-nocheck
'use client'

import { useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { SimulationOverlay } from '@/components/simulation/SimulationOverlay'

const SIDEBAR_COLLAPSED_WIDTH = 48
const SIDEBAR_EXPANDED_WIDTH = 240

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  const sidebarWidth = isSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH

  return (
    <div className="min-h-screen">
      <AppSidebar
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <div
        className="transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <SimulationOverlay />
        <main>{children}</main>
      </div>
    </div>
  )
}
