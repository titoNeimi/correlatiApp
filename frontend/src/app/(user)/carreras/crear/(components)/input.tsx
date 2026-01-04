import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={[
          "w-full rounded-md border px-3 py-2",
          error ? "border-red-500" : "border-gray-300",
          className ?? "",
        ].join(" ")}
      />
    );
  }
);
Input.displayName = "Input";
