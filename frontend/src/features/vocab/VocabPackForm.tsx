import type { FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";

type VocabPackFormProps = {
  selectedGroupId: number | null;
  selectedGroupName: string;
  setSelectedGroupName: (value: string) => void;
  newEnglishWords: string[];
  newHebrewWords: string[];
  onRenameGroup: () => void;
  onDeleteGroup: () => void;
  onAddPack: (event: FormEvent) => void;
  onUpdateWordField: (side: "english" | "hebrew", index: number, value: string) => void;
  onAddWordField: (side: "english" | "hebrew") => void;
  onRemoveWordField: (side: "english" | "hebrew", index: number) => void;
};

export function VocabPackForm(props: VocabPackFormProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Selected group</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.selectedGroupId == null ? (
          <EmptyState>
            <EmptyStateTitle>Select a group first</EmptyStateTitle>
            <EmptyStateDescription>Pick an existing group or create a new one from the left column.</EmptyStateDescription>
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={props.selectedGroupName}
                onChange={(event) => props.setSelectedGroupName(event.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" type="button" onClick={props.onRenameGroup}>
                Rename
              </Button>
              <Button variant="destructive" type="button" onClick={props.onDeleteGroup}>
                Delete
              </Button>
            </div>

            <form onSubmit={props.onAddPack} className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">English</p>
                  <Button variant="ghost" size="sm" type="button" onClick={() => props.onAddWordField("english")}>
                    Add field
                  </Button>
                </div>
                {props.newEnglishWords.map((word, index) => (
                  <div key={`eng-${index}`} className="flex gap-2">
                    <Input
                      value={word}
                      onChange={(event) => props.onUpdateWordField("english", index, event.target.value)}
                      placeholder="English word"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => props.onRemoveWordField("english", index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Hebrew</p>
                  <Button variant="ghost" size="sm" type="button" onClick={() => props.onAddWordField("hebrew")}>
                    Add field
                  </Button>
                </div>
                {props.newHebrewWords.map((word, index) => (
                  <div key={`heb-${index}`} className="flex gap-2">
                    <Input
                      value={word}
                      onChange={(event) => props.onUpdateWordField("hebrew", index, event.target.value)}
                      placeholder="Hebrew word"
                      data-lang="he"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => props.onRemoveWordField("hebrew", index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button className="lg:col-span-2" type="submit">
                Add pack
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
