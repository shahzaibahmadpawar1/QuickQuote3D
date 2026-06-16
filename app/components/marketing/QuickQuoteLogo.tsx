import Image from 'next/image'
import { cn } from '@/lib/utils'

export const QUICKQUOTE_LOGO_SRC = '/quickquote-logo.png'

interface QuickQuoteLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

export function QuickQuoteLogo({ size = 28, className, priority = false }: QuickQuoteLogoProps) {
  return (
    <Image
      src={QUICKQUOTE_LOGO_SRC}
      alt="QuickQuote3D"
      width={size}
      height={size}
      priority={priority}
      className={cn('shrink-0 object-contain', className)}
    />
  )
}

interface QuickQuoteBrandProps {
  name: string
  logoSize?: number
  className?: string
  nameClassName?: string
  logoClassName?: string
  priority?: boolean
}

export function QuickQuoteBrand({
  name,
  logoSize = 28,
  className,
  nameClassName,
  logoClassName,
  priority = false
}: QuickQuoteBrandProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <QuickQuoteLogo size={logoSize} className={logoClassName} priority={priority} />
      <span className={nameClassName}>{name}</span>
    </span>
  )
}
