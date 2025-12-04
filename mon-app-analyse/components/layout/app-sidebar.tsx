// @ts-nocheck
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, TrendingUp, ChevronLeft, ChevronRight, Globe, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLLAPSED_WIDTH = 48
const EXPANDED_WIDTH = 240

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
}

const navItems: NavItem[] = [
  { href: '/accueil', icon: <Home className="h-5 w-5" />, label: 'Accueil' },
  { href: '/analyse-valeur', icon: <Search className="h-5 w-5" />, label: 'Analyse de la valeur' },
  { href: '/cours-matieres-premieres', icon: <TrendingUp className="h-5 w-5" />, label: 'Cours des MP' },
]

const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

interface AppSidebarProps {
  isExpanded: boolean
  onToggleExpand: () => void
}

export function AppSidebar({ isExpanded, onToggleExpand }: AppSidebarProps) {
  const [currentLang, setCurrentLang] = useState('fr')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/accueil') {
      return pathname === '/accueil' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const width = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-white border-r border-neutral flex flex-col z-50 transition-all duration-200"
      style={{ width }}
    >
      {/* Logo */}
      <div className="h-16 flex items-end pb-1 mb-4 pl-[14px] gap-3">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-7 flex-shrink-0"
        />
        {isExpanded && (
          <span className="font-semibold text-foreground">SCM</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-2">
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center h-8 transition-colors pl-[14px] gap-3",
                  "hover:bg-[#E6F1FE]",
                  isActive(item.href)
                    ? "bg-[#E6F1FE] text-foreground"
                    : "text-foreground"
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isExpanded && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-neutral py-4 space-y-3">
        {/* Toggle expand/collapse */}
        <button
          onClick={onToggleExpand}
          className="flex items-center h-8 w-full hover:bg-[#E6F1FE] text-foreground transition-colors pl-[14px] gap-3"
          title={isExpanded ? "Réduire" : "Étendre"}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Réduire</span>
            </>
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>

        {/* Avatar */}
        <button
          className="flex items-center h-8 w-full hover:bg-[#E6F1FE] text-foreground transition-colors pl-2 gap-3"
          title={!isExpanded ? "Profil" : undefined}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: '#4A148C' }}
          >
            JS
          </div>
          {isExpanded && <span className="text-sm font-medium">Mon profil</span>}
        </button>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={cn(
              "flex items-center h-8 w-full hover:bg-[#E6F1FE] text-foreground transition-colors",
              isExpanded ? "px-3 gap-3" : "justify-center"
            )}
            title={!isExpanded ? "Langue" : undefined}
          >
            <Globe className="h-5 w-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium">
                {languages.find(l => l.code === currentLang)?.label}
              </span>
            )}
          </button>
          {showLangMenu && (
            <div
              className="absolute bottom-full left-full ml-1 mb-1 bg-white border border-neutral rounded-md shadow-lg py-1 min-w-[120px] z-50"
              onMouseLeave={() => setShowLangMenu(false)}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLang(lang.code)
                    setShowLangMenu(false)
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-[#E6F1FE] transition-colors",
                    currentLang === lang.code ? "bg-[#E6F1FE] font-medium" : ""
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className={cn(
            "flex items-center h-8 w-full hover:bg-[#E6F1FE] text-foreground transition-colors",
            isExpanded ? "px-3 gap-3" : "justify-center"
          )}
          title={!isExpanded ? "Déconnexion" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Déconnexion</span>}
        </button>

        {/* Version */}
        <div className={cn(
          "h-8 flex items-center text-xs text-muted-foreground",
          isExpanded ? "px-3" : "justify-center"
        )}>
          {isExpanded ? "Version 1.0.0" : "v1.0"}
        </div>
      </div>
    </aside>
  )
}
