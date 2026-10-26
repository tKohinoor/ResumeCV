"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FileText, Plus, Clock, LayoutTemplate, Menu, X } from "lucide-react";

const nav = [
  { href: "/analyze", label: "New analysis", icon: Plus },
  { href: "/history", label: "History", icon: Clock },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold text-indigo-600">
        <FileText size={22} /> ResumeCV
      </Link>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <span className="font-bold text-indigo-600">ResumeCV</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <button className="absolute right-3 top-3" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-white md:block">
        {content}
      </aside>
    </>
  );
}