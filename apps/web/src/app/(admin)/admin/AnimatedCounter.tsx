"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string | undefined;
  suffix?: string | undefined;
  duration?: number | undefined;
}

function formatValue(n: number, prefix?: string): string {
  if (prefix === "Ksh") {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }
  return new Intl.NumberFormat("en-KE").format(Math.round(n));
}

export default function AnimatedCounter({
  value,
  prefix,
  suffix,
  duration = 1200,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }

    startTimeRef.current = null;

    function tick(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: starts fast, slows at end
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(eased * value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  const formatted = prefix === "Ksh" ? formatValue(display, "Ksh") : `${prefix ?? ""}${formatValue(display)}${suffix ?? ""}`;

  return <span>{formatted}</span>;
}
