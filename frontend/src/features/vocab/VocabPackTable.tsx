import type { VocabPack } from "../../lib/types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "../../components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

type VocabPackTableProps = {
  packs: VocabPack[];
  onRemovePack: (packId: number) => void;
};

export function VocabPackTable(props: VocabPackTableProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Packs</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {props.packs.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>No packs yet</EmptyStateTitle>
            <EmptyStateDescription>Add your first bilingual pack to build practice material.</EmptyStateDescription>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>English</TableHead>
                <TableHead>Hebrew</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.packs.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell>{pack.englishWords.join(", ")}</TableCell>
                  <TableCell data-lang="he">{pack.hebrewWords.join(", ")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" type="button" onClick={() => props.onRemovePack(pack.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
