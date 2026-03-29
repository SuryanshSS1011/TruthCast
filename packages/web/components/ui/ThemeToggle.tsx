"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Theme Toggle - Dark/Light mode switch
 *
 * Uses .light class on <html> element as per design doc
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.classList.toggle("light", stored === "light");
    } else {
      // Default to dark
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className={cn(
          "w-10 h-10 rounded-lg",
          "bg-[var(--bg-surface)]",
          "border border-[var(--border-subtle)]",
          className
        )}
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group relative w-10 h-10 rounded-lg",
        "bg-[var(--bg-surface)]",
        "border border-[var(--border-subtle)]",
        "hover:border-[var(--border-mid)]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verdict-true)]",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Sun icon (shown in dark mode) */}
      <svg
        className={cn(
          "absolute inset-0 m-auto w-5 h-5",
          "text-[var(--text-secondary)]",
          "transition-all duration-200",
          theme === "dark"
            ? "opacity-100 rotate-0"
            : "opacity-0 rotate-90 scale-50"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon icon (shown in light mode) */}
      <svg
        className={cn(
          "absolute inset-0 m-auto w-5 h-5",
          "text-[var(--text-secondary)]",
          "transition-all duration-200",
          theme === "light"
            ? "opacity-100 rotate-0"
            : "opacity-0 -rotate-90 scale-50"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </button>
  );
}

export default ThemeToggle;
