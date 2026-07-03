import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useGetCin7SyncStatus, useTriggerCin7Sync } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateRangeControl } from "@/components/date-range-control";
import { useDateRange } from "@/lib/use-date-range";
import { OverviewPage } from "@/pages/overview";
import { RetailersPage } from "@/pages/retailers";
import { ProductsPage } from "@/pages/products";
import { MarketingPage } from "@/pages/marketing";

export default function App() {
  const { range, activePreset, applyPreset, applyCustom } = useDateRange();
  const [tab, setTab] = useState("overview");
  const syncStatus = useGetCin7SyncStatus();
  const triggerSync = useTriggerCin7Sync({
    mutation: { onSuccess: () => syncStatus.refetch() },
  });

  const lastSynced = syncStatus.data
    ?.map((s) => s.lastSyncedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Retail Margins &amp; Retailer KPIs</h1>
            <p className="text-xs text-muted-foreground">
              Cin7 Core inventory &amp; sales, with marketing spend overlay
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {lastSynced ? `Cin7 synced ${new Date(lastSynced).toLocaleString()}` : "Not yet synced"}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={triggerSync.isPending}
              onClick={() => triggerSync.mutate()}
            >
              <RefreshCw className={triggerSync.isPending ? "size-3.5 animate-spin" : "size-3.5"} />
              Sync Cin7
            </Button>
            <DateRangeControl
              range={range}
              activePreset={activePreset}
              onPreset={applyPreset}
              onCustom={applyCustom}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {triggerSync.isError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Sync failed: {(triggerSync.error as Error).message}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="retailers">Retailers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewPage range={range} onViewRetailers={() => setTab("retailers")} />
          </TabsContent>
          <TabsContent value="retailers" className="mt-6">
            <RetailersPage range={range} />
          </TabsContent>
          <TabsContent value="products" className="mt-6">
            <ProductsPage range={range} />
          </TabsContent>
          <TabsContent value="marketing" className="mt-6">
            <MarketingPage range={range} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
