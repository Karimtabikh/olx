import React from "react";
import { cn } from "@/shared/utils/styling";

type Tag = "h1" | "h2" | "p";

type Variant =
  | "h1-regular"
  | "h1-bold"
  | "h2-regular"
  | "h2-bold"
  | "body-text-regular"
  | "body-text-bold";

const classes: Record<Variant, string> = {
  "h1-regular": "text-2xl font-normal",
  "h1-bold": "text-2xl font-bold",
  "h2-regular": "text-base font-normal",
  "h2-bold": "text-base font-bold",
  "body-text-regular": "text-sm font-normal",
  "body-text-bold": "text-sm font-bold",
};

const tagByVariant: Record<Variant, Tag> = {
  "h1-regular": "h1",
  "h1-bold": "h1",
  "h2-regular": "h2",
  "h2-bold": "h2",
  "body-text-regular": "p",
  "body-text-bold": "p",
};

type Props = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

export default function Typography({
  variant = "body-text-regular",
  className,
  children,
}: Props) {
  const Tag = tagByVariant[variant];

  return (
    <Tag className={cn(classes[variant], "text-black", className)}>
      {children}
    </Tag>
  );
}
