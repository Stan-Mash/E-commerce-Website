"use client";

import { useEffect, useRef } from "react";

const CSS = `
.animate-in-wrapper {
  opacity: 0;
  will-change: opacity, transform;
}
.animate-in-wrapper[data-direction="up"] {
  transform: translateY(32px);
}
.animate-in-wrapper[data-direction="left"] {
  transform: translateX(-40px);
}
.animate-in-wrapper[data-direction="right"] {
  transform: translateX(40px);
}
.animate-in-wrapper[data-direction="fade"] {
  transform: none;
}
.animate-in-wrapper.visible {
  opacity: 1;
  transform: none;
  transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}
`;

let injected = false;

function injectStyles() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const tag = document.createElement("style");
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

interface AnimateInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
  className?: string;
  style?: React.CSSProperties;
}

export function AnimateIn({
  children,
  delay = 0,
  direction = "up",
  className,
  style,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectStyles();

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const timeout = setTimeout(() => {
              el.classList.add("visible");
            }, delay * 1000);
            observer.unobserve(el);
            return () => clearTimeout(timeout);
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`animate-in-wrapper${className ? ` ${className}` : ""}`}
      data-direction={direction}
      style={style}
    >
      {children}
    </div>
  );
}
