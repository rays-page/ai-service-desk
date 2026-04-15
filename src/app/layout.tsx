import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AI Service Desk",
  description: "Intake, response, tracking, and follow-up for small service businesses."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
