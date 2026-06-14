import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import React from 'react'

import { cn } from "../../../logic/utils/cn"
import { useGlobalState } from "../../../logic/context/GlobalContext"
import { TPeran } from "../../../logic/types/ITs_Akun"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-RadiusSmall border border-transparent bg-clip-padding text-FontSizeSm font-bold whitespace-nowrap transition-all outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ColorPrimary/opacity-OpacitySubtle active:scale-TransformShrink disabled:pointer-events-none disabled:Brightness-100 disabled:opacity-50 disabled:text-TextColorMuted disabled:shadow-none disabled:border-transparent dark:disabled:bg-Colorbg/50% dark:disabled:text-TextColorMuted [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Perubahan: Default state menggunakan opacity-90 (0.9), hover menjadi opacity-100 (1)
        default: "bg-ColorPrimary text-White opacity-90 hover:opacity-100 shadow-ElevationLow",
        
        outline:
          "border-ColorSidebarBorder/opacity-OpacityMuted bg-transparent text-TextColorBase hover:bg-ColorPrimary/opacity-OpacitySubtle",
        
        secondary:
          "bg-ColorSecondary text-White opacity-90 hover:opacity-100 shadow-ElevationLow",
        
        tertiary:
          "bg-ColorTertiary text-White opacity-90 hover:opacity-100 shadow-ElevationLow",
        
        ghost:
          "hover:bg-ColorPrimary/opacity-OpacitySubtle text-TextColorBase",
        
        destructive:
          "bg-FeedbackColorError text-White opacity-90 hover:opacity-100 shadow-ElevationLow",
      },
      size: {
        default: "h-spacing-SpacingHuge px-SpacingBase py-SpacingTiny gap-SpacingTiny",
        sm: "h-spacing-SpacingLarge px-SpacingSmall text-FontSizeXs gap-SpacingTiny",
        lg: "h-spacing-SpacingExtraHuge px-SpacingLarge text-FontSizeBase gap-SpacingBase",
        icon: "h-spacing-SpacingHuge w-spacing-SpacingHuge justify-center",
        inline: "h-auto px-SpacingTiny py-SpacingNano text-FontSizeXs gap-SpacingNano",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const MotionButtonPrimitive = motion(ButtonPrimitive)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <MotionButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      whileTap={{ scale: 0.95 }}
      {...props}
    />
  )
}

export interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const BaseCustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(({
  className,
  variant,
  size,
  icon,
  iconPosition = 'left',
  isLoading,
  children,
  ...props
}, ref) => {
  const { state } = useGlobalState();
  const isGuest = state.user?.peran === TPeran.GUEST;

  // Hiding core action buttons for Guests (CRUD and key actions)
  // Usually Primary, Destructive, and sometimes Secondary are used for actions.
  // tertiary and ghost are often used for navigation/info.
  if (isGuest && (variant === 'default' || variant === 'destructive' || variant === 'secondary' || variant === 'tertiary')) {
    // Only hide if it's not a generic button that might be used for navigation
    // But per user request, "tanpa ada tombol CRUD atau aksi apapun"
    return null;
  }

  return (
    <motion.button
      ref={ref as any}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || props.disabled}
      whileTap={{ scale: 0.95 }}
      {...props as any}
    >
      {isLoading && <Loader2 className="w-spacing-SpacingBase h-spacing-SpacingBase animate-spin mr-SpacingTiny" />}
      {!isLoading && icon && iconPosition === 'left' && <span className="mr-0">{icon}</span>}
      {children}
      {!isLoading && icon && iconPosition === 'right' && <span className="ml-0">{icon}</span>}
    </motion.button>
  )
})
BaseCustomButton.displayName = 'BaseCustomButton'

export const PrimaryButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>((props, ref) => {
  return <BaseCustomButton ref={ref} {...props} />
})
PrimaryButton.displayName = 'PrimaryButton'

export const InCommonButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(({ className, size = 'sm', variant = 'secondary', ...props }, ref) => {
  return <BaseCustomButton ref={ref} size={size} variant={variant} className={cn("shadow-none", className)} {...props} />
})
InCommonButton.displayName = 'InCommonButton'

export const InlineButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(({ className, size = 'inline', variant = 'ghost', ...props }, ref) => {
  return <BaseCustomButton ref={ref} size={size} variant={variant} className={cn("hover:underline underline-offset-4", className)} {...props} />
})
InlineButton.displayName = 'InlineButton'

export const SecondaryButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>((props, ref) => {
  return <BaseCustomButton ref={ref} variant="secondary" {...props} />
})
SecondaryButton.displayName = 'SecondaryButton'

export const TertiaryButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>((props, ref) => {
  return <BaseCustomButton ref={ref} variant="tertiary" {...props} />
})
TertiaryButton.displayName = 'TertiaryButton'

export const DangerButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>((props, ref) => {
  return <BaseCustomButton ref={ref} variant="destructive" {...props} />
})
DangerButton.displayName = 'DangerButton'

export const GhostButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>((props, ref) => {
  return <BaseCustomButton ref={ref} variant="ghost" {...props} />
})
GhostButton.displayName = 'GhostButton'

export const IconButton = React.forwardRef<HTMLButtonElement, CustomButtonProps & { icon: React.ReactNode }>(({ icon, ...props }, ref) => {
  return <BaseCustomButton ref={ref} size="icon" icon={icon} {...props} />
})
IconButton.displayName = 'IconButton'

export { Button, buttonVariants }