import { cn } from '@/lib/utils'

interface MessageProps {
  content: string
  sender: string
  timestamp: string
  isCurrentUser?: boolean
  className?: string
}

export function Message({
  content,
  sender,
  timestamp,
  isCurrentUser,
  className,
}: MessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg p-4',
        isCurrentUser
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'bg-muted',
        className,
      )}
    >
      <div className="text-sm font-medium">{sender}</div>
      <div className="text-sm">{content}</div>
      <div className="text-xs text-muted-foreground">{timestamp}</div>
    </div>
  )
}
