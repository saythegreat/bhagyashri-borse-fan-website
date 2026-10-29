"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import CollectorNav from "@/components/navigation/CollectorNav";

export default function CollectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // If on login page, don't check auth
    if (pathname === "/collector/login") {
      setIsAuthenticated(true);
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace("/collector/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (pathname === "/collector/login") {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-dark flex flex-col lg:flex-row">
      <CollectorNav />
      <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}
