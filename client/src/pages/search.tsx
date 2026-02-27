import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, FileText, ClipboardList, Receipt, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, WO_STATUS_MAP } from "@/lib/constants";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = results && (
    results.quotations?.length > 0 ||
    results.workOrders?.length > 0 ||
    results.invoices?.length > 0 ||
    results.purchaseOrders?.length > 0
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold" data-testid="text-search-title">Search Documents</h1>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by client name or project number..."
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}

      {results && !hasResults && query.length >= 2 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No documents found for "{query}"</p>
          </CardContent>
        </Card>
      )}

      {hasResults && (
        <div className="space-y-4">
          {results.quotations?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Quotations</h2>
              {results.quotations.map((q: any) => (
                <Link key={q.id} href={`/quotations/${q.id}`}>
                  <Card className="hover-elevate cursor-pointer mb-2">
                    <CardContent className="p-3 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">QUO/{q.projectNumber}</p>
                        <p className="text-xs text-muted-foreground">{q.date}</p>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(q.total)}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {results.workOrders?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Work Orders</h2>
              {results.workOrders.map((wo: any) => {
                const si = WO_STATUS_MAP[wo.status];
                return (
                  <Link key={wo.id} href={`/work-orders/${wo.id}`}>
                    <Card className="hover-elevate cursor-pointer mb-2">
                      <CardContent className="p-3 flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">WO/{wo.projectNumber}</p>
                          <p className="text-xs text-muted-foreground">{wo.customerName}</p>
                        </div>
                        {si && <Badge variant="secondary" className={si.color}>{si.label}</Badge>}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {results.invoices?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Invoices</h2>
              {results.invoices.map((inv: any) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}>
                  <Card className="hover-elevate cursor-pointer mb-2">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">INV/{inv.projectNumber}</p>
                        <p className="text-xs text-muted-foreground">{inv.date}</p>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(inv.total)}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {results.purchaseOrders?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Purchase Orders</h2>
              {results.purchaseOrders.map((po: any) => (
                <Card key={po.id} className="hover-elevate mb-2">
                  <CardContent className="p-3 flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-orange-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{po.poNumber}</p>
                      <p className="text-xs text-muted-foreground">Project: {po.projectNumber}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{po.dateReceived}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
