"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "../lib/track";

// Her route değişiminde page_view gönderir. Root layout'a mount edilir.
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view");
  }, [pathname]);

  return null;
}
