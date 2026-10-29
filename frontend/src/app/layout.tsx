import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "A World of Bhagyashri | A Fan Tribute to Bhagyashri Borse",
  description:
    "An elegant, cinematic, interactive fan tribute celebrating Indian actress Bhagyashri Borse, her filmography, public appearances, and screen presence. Some smiles stay in your heart forever.",
  keywords: [
    "Bhagyashri Borse",
    "Mr Bachchan",
    "Lenin",
    "Yaariyan 2",
    "Telugu Cinema",
    "Indian Actress",
    "Fan Tribute",
    "Reppal Dappul",
  ],
  authors: [{ name: "Bhagyashri Borse Fans" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-cinema-dark text-ivory flex flex-col selection:bg-rose-500 selection:text-white">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
