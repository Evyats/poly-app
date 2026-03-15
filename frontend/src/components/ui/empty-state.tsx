import * as React from "react";

import { cn } from "../../lib/utils";

export function EmptyState({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyStateIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex size-14 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm", className)}
      {...props}
    />
  );
}

export function EmptyStateTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function EmptyStateDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("max-w-md text-sm text-muted-foreground", className)} {...props} />;
}
