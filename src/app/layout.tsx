import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeCV – Score your resume",
  description: "Get an instant score and actionable feedback on your resume.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}