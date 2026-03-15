import type { ReactNode } from "react";

import { Badge } from "./ui/badge";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, meta, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {meta ? <span className="text-sm text-muted-foreground">{meta}</span> : null}
        {action}
      </div>
    </div>
  );
}
