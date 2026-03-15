import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DatePicker } from "../../components/ui/date-picker";
import { Input } from "../../components/ui/input";

type WeightEntryFormProps = {
  date: string;
  setDate: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  onSave: () => Promise<void>;
};

export function WeightEntryForm({ date, setDate, weight, setWeight, onSave }: WeightEntryFormProps) {
  return (
    <Card className="glass-panel h-fit">
      <CardHeader>
        <CardTitle>New weigh-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DatePicker value={date} onChange={setDate} />
        <Input type="number" min={1} step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Weight in kg" required />
        <Button className="w-full" type="button" onClick={() => void onSave()}>
          Save entry
        </Button>
      </CardContent>
    </Card>
  );
}
