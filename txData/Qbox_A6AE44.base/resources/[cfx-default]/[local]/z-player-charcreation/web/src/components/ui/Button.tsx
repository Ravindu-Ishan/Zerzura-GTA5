"use client";

import { ButtonHTMLAttributes } from "react";
import Icon, { IconName } from "./Icon";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
  icon?: IconName;
  iconAfter?: IconName;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export default function Button({
  variant = "ghost",
  size = "md",
  icon,
  iconAfter,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`btn ${VARIANT_CLASS[variant]} ${size === "sm" ? "btn-sm" : ""} ${className}`}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 15} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === "sm" ? 13 : 15} />}
    </button>
  );
}
