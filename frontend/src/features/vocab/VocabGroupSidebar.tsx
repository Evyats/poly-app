import type { FormEvent } from "react";

import type { VocabGroup } from "../../lib/types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Plus } from "lucide-react";

type VocabGroupSidebarProps = {
  groups: VocabGroup[];
  selectedGroupId: number | null;
  newGroupName: string;
  setNewGroupName: (value: string) => void;
  onSelectGroup: (groupId: number) => void;
  onCreateGroup: (event: FormEvent) => void;
};

export function VocabGroupSidebar(props: VocabGroupSidebarProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={props.onCreateGroup} className="space-y-3">
          <Input
            value={props.newGroupName}
            onChange={(event) => props.setNewGroupName(event.target.value)}
            placeholder="New group"
          />
          <Button className="w-full" type="submit">
            <Plus className="size-4" />
            Add group
          </Button>
        </form>

        {props.groups.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>No groups yet</EmptyStateTitle>
            <EmptyStateDescription>Create your first group to start storing word packs.</EmptyStateDescription>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {props.groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => props.onSelectGroup(group.id)}
                className={[
                  "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors",
                  props.selectedGroupId === group.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/70 text-foreground hover:bg-accent",
                ].join(" ")}
              >
                <span className="font-medium">{group.name}</span>
                <Badge variant={props.selectedGroupId === group.id ? "secondary" : "outline"}>{group.packCount}</Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
