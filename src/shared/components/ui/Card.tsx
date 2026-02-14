import { cn } from "@/shared/utils/styling";

type CardProps = {
  children: React.ReactNode;
  variant: "primary" | "secondary";
  className?: string;
};

export default function Card({
  children,
  variant,
  className,
  ...props
}: CardProps) {
  const variantClasses = {
    primary: "border-[#d0d2d3] bg-white",
    secondary: "border-none bg-[#f1f1f2]",
  };

  return (
    <div
      className={cn("rounded-sm p-4", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
