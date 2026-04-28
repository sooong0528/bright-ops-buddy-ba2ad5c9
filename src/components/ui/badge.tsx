import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* AntD Tag：圆角 4 / 12px 字号 / 浅色底 + 主色文字 + 浅边框 */
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-px text-xs font-normal leading-5 transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary-soft text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive-soft text-destructive",
        outline: "border-border bg-transparent text-foreground",
        success: "border-success/30 bg-success-soft text-success",
        warning: "border-warning/30 bg-warning-soft text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
