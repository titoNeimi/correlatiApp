import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, error, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        {...props}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className ?? ""}`}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
