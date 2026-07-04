"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { navItems } from "@/components/layout/nav-items";

function NavIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

type DashboardLayoutProps = {
  children: ReactNode;
};

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1 bg-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-blue-900 text-white shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-blue-800 px-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-300">
              Berbel
            </p>
            <p className="text-lg font-bold leading-tight">Connect</p>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-blue-200 hover:bg-blue-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              const isLink = item.href !== "#";

              return (
                <li key={item.label}>
                  {isLink ? (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-blue-700 text-white shadow-sm"
                          : "text-blue-100 hover:bg-blue-800 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="flex cursor-not-allowed items-center rounded-lg px-3 py-2.5 text-sm font-medium text-blue-300/60">
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-blue-800 p-4">
          <div className="rounded-lg bg-blue-800/60 px-3 py-3">
            <p className="text-xs text-blue-200">Representante</p>
            <p className="text-sm font-semibold">Marcelo Henrique</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <NavIcon />
            </button>
            <div>
              <p className="text-sm text-slate-500 sm:text-base">Olá, Marcelo</p>
            </div>
          </div>
          <p className="text-base font-semibold text-blue-700 sm:text-lg">
            Berbel Connect
          </p>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
