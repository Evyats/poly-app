import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "../../lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-input shadow-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-background transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
