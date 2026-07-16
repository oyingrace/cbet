"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Entry point. MiniPay detection, auto-connect, and player registration happen
 * in the provider tree (AppProvider); once mounted we send the player to the
 * home dashboard.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg-primary">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-dream-blue border-t-transparent" />
    </div>
  );
}
