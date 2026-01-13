import * as React from "react";

import { cn } from "@/lib/utils";

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        data-slot="native-select"
        aria-invalid={error || props["aria-invalid"]}
        className={cn(
          "w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "border-input",
          className
        )}
        {...props}
      />
    );
  }
);

NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
