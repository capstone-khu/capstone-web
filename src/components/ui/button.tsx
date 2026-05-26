import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold ring-offset-background transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-gray-800',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-gray-200',
        outline: 'border border-input bg-background text-foreground hover:bg-gray-50',
        ghost: 'text-foreground hover:bg-gray-100',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-gray-800',
        link: 'text-foreground underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        default: 'h-12 px-5 text-base',
        sm: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-14 px-6 text-base',
        xl: 'h-[60px] px-7 text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
