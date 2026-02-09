"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  children: React.ReactNode;
};

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-3/4 bg-white flex items-center justify-center p-5">
      {children}
    </div>
  );
}

type AuthCardProps = {
  children: React.ReactNode;
};

function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-300 hover:shadow-3xl">
      {children}
    </div>
  );
}

type AuthHeaderProps = {
  title?: string;
  subtitle?: string;
};

function AuthHeader({
  title = "AcadifyApp",
  subtitle = "Gestiona tu progreso académico",
}: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-indigo-600 mb-2">{title}</h1>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
}

type AuthFieldProps = React.ComponentProps<"input"> & {
  label: string;
  errorMessage?: string;
};

function AuthField({
  label,
  errorMessage,
  className,
  id,
  name,
  ...props
}: AuthFieldProps) {
  const controlId = id ?? name;

  return (
    <div>
      <Label
        htmlFor={controlId}
        className="block text-gray-700 font-semibold mb-2 text-sm"
      >
        {label}
      </Label>
      <Input
        id={controlId}
        name={name}
        aria-invalid={!!errorMessage}
        className={cn(
          "h-auto px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-100",
          errorMessage
            ? "border-red-500 focus-visible:border-red-500"
            : "border-gray-200 focus-visible:border-indigo-500",
          className
        )}
        {...props}
      />
      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  );
}

type AuthSubmitButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
};

function AuthSubmitButton({
  isLoading,
  className,
  children,
  disabled,
  type,
  ...props
}: AuthSubmitButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);

  return (
    <Button
      type={type ?? "submit"}
      disabled={isDisabled}
      className={cn(
        "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-4 rounded-xl text-lg font-semibold transition-all duration-300 relative overflow-hidden",
        isDisabled
          ? "opacity-80 cursor-not-allowed"
          : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300",
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      <span className={isLoading ? "opacity-0" : "opacity-100"}>{children}</span>
    </Button>
  );
}

type AuthDividerProps = {
  label?: string;
  className?: string;
};

function AuthDivider({ label = "o continúa con", className }: AuthDividerProps) {
  return (
    <div className={cn("relative my-8", className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-4 text-gray-500">{label}</span>
      </div>
    </div>
  );
}

type AuthSocialButtonProps = React.ComponentProps<typeof Button> & {
  icon: React.ReactNode;
};

function AuthSocialButton({ icon, className, children, ...props }: AuthSocialButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all duration-300 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md bg-white",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
}

export {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthField,
  AuthSubmitButton,
  AuthDivider,
  AuthSocialButton,
};
