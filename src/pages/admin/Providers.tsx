import { useState } from "react";
import { Shield, Star, Ban, CheckCircle2, Search, Loader2, FileText, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CATEGORIES } from "@/constants/categories";

const PAGE_SIZE = 20;

const AdminProviders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["admin-providers"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_provider", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase.from("profiles").update({
        provider_verified: status === "approved",
        provider_verification_status: status,
        provider_verification_notes: notes || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedProvider(null);
      setVerifyNotes("");
      toast.success("Estado del prestador actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openReview = async (provider: any) => {
    setSelectedProvider(provider);
    setVerifyNotes(provider.provider_verification_notes || "");
    const paths: string[] = provider.provider_doc_urls || [];
    const urls: string[] = [];
    try {
      for (const path of paths) {
        const { data } = await supabase.storage.from("provider-docs").createSignedUrl(path, 3600);
        if (data?.signedUrl) urls.push(data.signedUrl);
      }
    } catch (err) {
      console.error("Error loading document URLs:", err);
      toast.error("Error al cargar documentos");
    }
    setDocUrls(urls);
  };

  const filtered = providers?.filter((p) => {
    const matchesSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.provider_category?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const currentStatus = p.provider_verification_status || (p.provider_verified ? "approved" : "pending");
    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;
    const matchesCategory = categoryFilter === "all" || p.provider_category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil((filtered?.length || 0) / PAGE_SIZE);
  const paginatedProviders = filtered?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const providerCategories = [...new Set(providers?.map(p => p.provider_category).filter(Boolean) || [])];

  const statusBadge = (p: any) => {
    const s = p.provider_verification_status || (p.provider_verified ? "approved" : "pending");
    if (s === "approved") return <Badge className="bg-success/10 text-success">Verificado</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rechazado</Badge>;
    return <Badge className="bg-warning/10 text-warning">Pendiente</Badge>;
  };

  const countByStatus = (status: string) => {
    return providers?.filter(p => {
      const s = p.provider_verification_status || (p.provider_verified ? "approved" : "pending");
      return s === status;
    }).length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Prestadores</h1>
          <div className="flex gap-3 mt-1 text-sm">
            <span className="text-muted-foreground">{providers?.length || 0} total</span>
            <span className="text-success">{countByStatus("approved")} verificados</span>
            <span className="text-warning">{countByStatus("pending")} pendientes</span>
            <span className="text-destructive">{countByStatus("rejected")} rechazados</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 w-48" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Verificados</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={handleFilterChange(setCategoryFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {providerCategories.map(cat => (
                <SelectItem key={cat} value={cat!}>{CATEGORIES.find(c => c.slug === cat)?.name || cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !paginatedProviders?.length ? (
            <p className="text-sm text-muted-foreground text-center py-12">No se encontraron prestadores</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Trabajos</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProviders.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {p.full_name?.[0] || "?"}
                          </div>
                          <div>
                            <span className="font-medium block">{p.full_name}</span>
                            <span className="text-xs text-muted-foreground">{p.phone || "—"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{CATEGORIES.find(c => c.slug === p.provider_category)?.name || p.provider_category || "—"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{Number(p.rating_avg).toFixed(1)}</span>
                      </TableCell>
                      <TableCell className="text-sm">{p.completed_jobs || 0}</TableCell>
                      <TableCell>
                        {(p.provider_doc_urls as string[] | null)?.length ? (
                          <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{(p.provider_doc_urls as string[]).length}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin docs</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(p)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openReview(p)}>
                          <Eye className="h-3 w-3" /> Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered?.length || 0)} de {filtered?.length}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={(o) => !o && setSelectedProvider(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verificar Prestador: {selectedProvider?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Categoría:</span> {CATEGORIES.find(c => c.slug === selectedProvider?.provider_category)?.name || selectedProvider?.provider_category}</div>
              <div><span className="text-muted-foreground">Teléfono:</span> {selectedProvider?.phone || "—"}</div>
              <div><span className="text-muted-foreground">Rating:</span> {Number(selectedProvider?.rating_avg || 0).toFixed(1)} ({selectedProvider?.review_count || 0} reseñas)</div>
              <div><span className="text-muted-foreground">Trabajos:</span> {selectedProvider?.completed_jobs || 0}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Bio:</span> {selectedProvider?.bio || "—"}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Registrado:</span> {selectedProvider?.created_at ? new Date(selectedProvider.created_at).toLocaleDateString("es-AR") : "—"}</div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Documentos ({docUrls.length})</h4>
              {docUrls.length === 0 ? (
                <p className="text-sm text-muted-foreground">El prestador no subió documentos.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {docUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="border rounded-lg p-3 flex items-center gap-2 hover:bg-accent transition-colors text-sm">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span>Documento {i + 1}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas de verificación</label>
              <Textarea value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} placeholder="Observaciones sobre los documentos..." rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              disabled={verifyMutation.isPending}
              onClick={() => verifyMutation.mutate({ id: selectedProvider.id, status: "rejected", notes: verifyNotes })}
            >
              <Ban className="h-4 w-4 mr-1" /> Rechazar
            </Button>
            <Button
              disabled={verifyMutation.isPending}
              onClick={() => verifyMutation.mutate({ id: selectedProvider.id, status: "approved", notes: verifyNotes })}
            >
              {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;
