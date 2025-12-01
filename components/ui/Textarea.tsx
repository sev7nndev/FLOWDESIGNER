import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-sm text-white ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }