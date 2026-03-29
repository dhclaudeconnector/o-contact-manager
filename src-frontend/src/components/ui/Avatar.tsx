// Path: src-frontend/src/components/ui/Avatar.tsx

import { useState } from 'react'
import { clsx } from 'clsx'
import { getInitials, getAvatarColor } from '@/utils/avatar'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

interface AvatarProps {
  name?: string | null
  photoUrl?: string | null
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-body-sm',
  lg: 'h-14 w-14 text-title-sm',
  xl: 'h-20 w-20 text-title-lg',
  xxl: 'h-[120px] w-[120px] text-[2rem]',
}

export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)

  const showImage = photoUrl && !imgError

  return (
    <div
      className={clsx(
        'relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold text-white select-none',
        sizeClasses[size],
        className
      )}
      style={!showImage ? { backgroundColor: bgColor } : undefined}
      aria-label={name || 'Contact'}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={name || 'Contact'}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
