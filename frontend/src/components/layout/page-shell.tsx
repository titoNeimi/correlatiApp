import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  backgroundClassName?: string;
};

function PageShell({
  children,
  className,
  mainClassName,
  backgroundClassName = "bg-gradient-to-br from-slate-50 via-white to-amber-50",
}: PageShellProps) {
  return (
    <div className={cn("min-h-screen", backgroundClassName, className)}>
      <main
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10",
          mainClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}

export { PageShell };
