import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import {
  useCreateMarketingSpend,
  useDeleteMarketingSpend,
  useGetRetailerKpis,
  useImportMarketingSpend,
  useListMarketingSpend,
} from "@workspace/api-client-react";
import type { DateRange } from "@/lib/use-date-range";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";

const LOOKER_STUDIO_EMBED_URL = import.meta.env.VITE_LOOKER_STUDIO_EMBED_URL as string | undefined;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MarketingPage({ range }: { range: DateRange }) {
  const spend = useListMarketingSpend(range);
  const retailers = useGetRetailerKpis(range);
  const createSpend = useCreateMarketingSpend({ mutation: { onSuccess: () => spend.refetch() } });
  const deleteSpend = useDeleteMarketingSpend({ mutation: { onSuccess: () => spend.refetch() } });
  const importSpend = useImportMarketingSpend({ mutation: { onSuccess: () => spend.refetch() } });

  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const total = spend.data?.reduce((s, e) => s + e.amount, 0) ?? 0;

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const contentBase64 = await fileToBase64(file);
    importSpend.mutate({ data: { filename: file.name, contentBase64 } });
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-1 text-sm font-medium">Media buying report (Looker Studio)</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Embed your Looker Studio media-spend report for visual cross-reference. Set{" "}
          <code className="rounded bg-muted px-1 py-0.5">VITE_LOOKER_STUDIO_EMBED_URL</code> to enable.
        </p>
        {LOOKER_STUDIO_EMBED_URL ? (
          <iframe
            src={LOOKER_STUDIO_EMBED_URL}
            className="h-[480px] w-full rounded-md border border-border"
            title="Looker Studio media spend report"
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            No Looker Studio report embedded yet
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">Marketing spend entries</h3>
            <p className="text-xs text-muted-foreground">Total in range: {formatCurrency(total)}</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileSelected} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-3.5" />
              Import CSV/XLSX
            </Button>
            <AddSpendDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              retailers={retailers.data ?? []}
              onSubmit={(input) =>
                createSpend.mutate({ data: input }, { onSuccess: () => setDialogOpen(false) })
              }
              pending={createSpend.isPending}
            />
          </div>
        </div>

        {importSpend.data && (
          <div className="mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">
            Imported {importSpend.data.imported}, skipped {importSpend.data.skipped}.
            {importSpend.data.errors.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-destructive">
                {importSpend.data.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {spend.isLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : spend.isError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load marketing spend.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(spend.data ?? []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.retailerName ?? <span className="text-muted-foreground">Unallocated</span>}</TableCell>
                    <TableCell>{entry.channel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(entry.amount, true)}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.source}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => deleteSpend.mutate({ id: entry.id })}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function AddSpendDialog({
  open,
  onOpenChange,
  retailers,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailers: { retailerId: number; name: string }[];
  onSubmit: (input: {
    retailerId: number | null;
    channel: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
    notes?: string;
  }) => void;
  pending: boolean;
}) {
  const [retailerId, setRetailerId] = useState<string>("unallocated");
  const [channel, setChannel] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Add entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add marketing spend entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Retailer</Label>
            <Select value={retailerId} onValueChange={setRetailerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unallocated">Unallocated (brand-level)</SelectItem>
                {retailers.map((r) => (
                  <SelectItem key={r.retailerId} value={String(r.retailerId)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Channel</Label>
            <Input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Meta Ads, Google Ads…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Period start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Period end</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Amount (USD)</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!channel || !periodStart || !periodEnd || !amount || pending}
            onClick={() =>
              onSubmit({
                retailerId: retailerId === "unallocated" ? null : Number(retailerId),
                channel,
                periodStart,
                periodEnd,
                amount: Number(amount),
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
