import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* AntD 按钮规范：
   - 高度 small 24 / middle 32 / large 40
   - 圆角 6px、字号 14px、水平内边距 15px
   - 主按钮 Primary、次按钮 Default(白底+边框)、Ghost、Link、Dashed、Danger */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_2px_0_hsl(215_100%_44%/0.1)] hover:bg-primary/90 active:bg-primary/95",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_2px_0_hsl(0_75%_40%/0.1)] hover:bg-destructive/90",
        outline: "border border-input bg-card text-foreground hover:text-primary hover:border-primary",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:text-primary hover:border-primary",
        ghost: "text-foreground hover:bg-muted hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 h-auto p-0",
        dashed: "border border-dashed border-input bg-card text-foreground hover:text-primary hover:border-primary",
      },
      size: {
        default: "h-8 px-4 py-1",
        sm: "h-6 rounded-sm px-2 text-xs",
        lg: "h-10 rounded-md px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
