"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/accueil", label: "Accueil" },
    { href: "/analyse-valeur", label: "Analyse de la valeur" },
  ];

  return (
    <header className="app-header sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-[50px]">
        <div className="flex items-center gap-6">
          <Link href="/accueil" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent hover:bg-transparent focus:bg-transparent hover:text-[#0970E6] active:text-[#0970E6] focus:text-[#0970E6]",
                        pathname === item.href
                          ? "font-bold text-[#0970E6]"
                          : "font-medium text-black"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/cours-matieres-premieres"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent hover:bg-transparent focus:bg-transparent hover:text-[#0970E6] active:text-[#0970E6] focus:text-[#0970E6]",
                      pathname === "/cours-matieres-premieres"
                        ? "font-bold text-[#0970E6]"
                        : "font-medium text-black"
                    )}
                  >
                    Cours des matières premières
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
