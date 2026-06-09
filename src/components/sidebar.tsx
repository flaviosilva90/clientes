"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const nav: { href: string; label: string; short?: string; icon: LucideIcon }[] =
  [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/mensalidades", label: "Mensalidades", icon: Receipt },
    {
      href: "/contas-receber",
      label: "Contas a receber",
      short: "Contas",
      icon: Wallet,
    },
  ];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ email }: { email: string }) {
  const isActive = useIsActive();

  return (
    <>
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Users className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900">Clientes</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-3 pb-2 text-xs text-slate-500" title={email}>
            {email}
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Barra inferior - mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
        {nav.map(({ href, label, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-center text-xs font-medium transition ${
              isActive(href) ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {short ?? label}
          </Link>
        ))}
        <form action="/auth/signout" method="post" className="flex flex-1">
          <button
            type="submit"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-center text-xs font-medium text-slate-500"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </form>
      </nav>
    </>
  );
}
