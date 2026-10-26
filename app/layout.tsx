import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenQuill - Free & Unlimited Writing, Paraphrasing, Plagiarism & Grammar Suite",
  description: "Free, open-source writing suite featuring Paraphrasing, Plagiarism Checking, Grammar & Spell Checking, AI Content Detection, AI Humanizer, Co-Writer Chat, and Document Translation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fafbfc] text-[#202124]">
        {children}
      </body>
    </html>
  );
}
