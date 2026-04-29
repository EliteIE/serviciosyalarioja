import { useState } from "react";
import {
  Shield, Star, Ban, CheckCircle2, Search, Loader2, FileText, Eye,
  ChevronLeft, ChevronRight, ShieldAlert, Clock, Users, XCircle,
  AlertTriangle, ExternalLink, CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminProviders, useAdminVerifyProvider, useAdminUpdateCriminalRecord, useAdminFileSignedUrl } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { CATEGORIES } from "@/constants/categories";
import { logger } from "@/lib/logger";
import { useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;

const AdminProviders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<unknown>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  // Antecedentes Penales state
  const [criminalNotes, setCriminalNotes] = useState("");
  const [criminalExpiry, setCriminalExpiry] = useState("");
  const [criminalDocUrl, setCriminalDocUrl] = useState("");

  const { data: providers, isLoading } = useAdminProviders();
  const verifyMutation = useAdminVerifyProvider();
  const updateCriminalRecord = useAdminUpdateCriminalRecord();
  const getSignedUrl = useAdminFileSignedUrl();

  const openReview = async (provider) => {
    setSelectedProvider(provider);
    setVerifyNotes(provider.provider_verification_notes || "");
    setCriminalNotes(provider.criminal_record_notes || "");
    setCriminalExpiry(provider.criminal_record_expiry || "");
    setCriminalDocUrl("");

    // Load provider doc signed URLs
    const paths: string[] = provider.provider_doc_urls || [];
    const urls: string[] = [];
    try {
      for (const path of paths) {
        const signedUrl = await getSignedUrl.mutateAsync(path);
        if (signedUrl) urls.push(signedUrl);
      }
    } catch (err) {
      logger.error("Error loading document URLs:", err);
      toast.error("Error al cargar documentos");
    }
    setDocUrls(urls);

    // Load criminal record signed URL
    if (provider.criminal_record_url) {
      try {
        const signedUrl = await getSignedUrl.mutateAsync(provider.criminal_record_url);
        if (signedUrl) setCriminalDocUrl(signedUrl);
      } catch (err) {
        logger.error("Error loading criminal record URL:", err);
      }
    }
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

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const providerCategories = [...new Set(providers?.map(p => p.provider_category).filter(Boolean) || [])];

  const statusBadge = (p) => {
    const s = p.provider_verification_status || (p.provider_verified ? "approved" : "pending");
    if (s === "approved") return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Verificado
      </Badge>
    );
    if (s === "rejected") return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 gap-1">
        <XCircle className="h-3 w-3" /> Rechazado
      </Badge>
    );
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1">
        <Clock className="h-3 w-3" /> Pendiente
      </Badge>
    );
  };

  const criminalStatusBadge = (status: string | null | undefined) => {
    const s = status || "not_submitted";
    if (s === "approved") return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Aprobado
      </Badge>
    );
    if (s === "rejected") return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 gap-1">
        <XCircle className="h-3 w-3" /> Rechazado
      </Badge>
    );
    if (s === "pending") return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1">
        <Clock className="h-3 w-3" /> Pendiente
      </Badge>
    );
    if (s === "expired") return (
      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0 gap-1">
        <AlertTriangle className="h-3 w-3" /> Vencido
      </Badge>
    );
    return (
      <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0 gap-1">
        <ShieldAlert className="h-3 w-3" /> Sin enviar
      </Badge>
    );
  };

  const countByStatus = (status: string) => {
    return providers?.filter(p => {
      const s = p.provider_verification_status || (p.provider_verified ? "approved" : "pending");
      return s === status;
    }).length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">
            Gestión de Prestadores
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
              <Users className="h-3.5 w-3.5" /> {providers?.length || 0} total
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> {countByStatus("approved")} verificados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> {countByStatus("pending")} pendientes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400">
              <XCircle className="h-3.5 w-3.5" /> {countByStatus("rejected")} rechazados
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, categoría o teléfono..."
            className="pl-10 rounded-[16px] border-border bg-card h-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
          <SelectTrigger className="w-40 rounded-[16px] border-border bg-card h-10">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Verificados</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={handleFilterChange(setCategoryFilter)}>
          <SelectTrigger className="w-44 rounded-[16px] border-border bg-card h-10">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {providerCategories.map(cat => (
              <SelectItem key={cat} value={cat!}>{CATEGORIES.find(c => c.slug === cat)?.name || cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Card */}
      <Card className="rounded-[24px] shadow-lg border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando prestadores...</p>
            </div>
          ) : !paginatedProviders?.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-muted-foreground">No se encontraron prestadores</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-border">
                    <TableHead className="font-semibold text-foreground">Prestador</TableHead>
                    <TableHead className="font-semibold text-foreground">Categoría</TableHead>
                    <TableHead className="font-semibold text-foreground">Rating</TableHead>
                    <TableHead className="font-semibold text-foreground">Trabajos</TableHead>
                    <TableHead className="font-semibold text-foreground">Docs</TableHead>
                    <TableHead className="font-semibold text-foreground">Estado</TableHead>
                    <TableHead className="font-semibold text-foreground">Antecedentes</TableHead>
                    <TableHead className="font-semibold text-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProviders.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {p.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-primary-foreground block">{p.full_name}</span>
                            <span className="text-xs text-muted-foreground">{p.phone || "Sin teléfono"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {CATEGORIES.find(c => c.slug === p.provider_category)?.name || p.provider_category || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(p.rating_avg).toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{p.completed_jobs || 0}</TableCell>
                      <TableCell>
                        {(p.provider_doc_urls as string[] | null)?.length ? (
                          <Badge variant="outline" className="gap-1 rounded-full border-slate-200 dark:border-slate-600">
                            <FileText className="h-3 w-3" />{(p.provider_doc_urls as string[]).length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Sin docs</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(p)}</TableCell>
                      <TableCell>{criminalStatusBadge(p.criminal_record_status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs gap-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                          onClick={() => openReview(p)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered?.length || 0)} de {filtered?.length}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="h-8 w-8 p-0 rounded-full border-slate-200 dark:border-slate-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
                      const pageNum = startPage + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={pageNum === page ? "default" : "outline"}
                          onClick={() => setPage(pageNum)}
                          className={`h-8 w-8 p-0 rounded-full text-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all ${pageNum === page ? "" : "border-slate-200 dark:border-slate-600"}`}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      className="h-8 w-8 p-0 rounded-full border-slate-200 dark:border-slate-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
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
      <Dialog open={!!selectedProvider} onOpenChange={(o) => { if (!o) { setSelectedProvider(null); setCriminalDocUrl(""); } }}>
        <DialogContent className="max-w-2xl rounded-[24px] p-0 overflow-hidden dark:bg-slate-900">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-primary-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Verificar Prestador
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedProvider?.full_name}
            </p>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Provider Info Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[16px] p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Información del Prestador</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Categoría:</span>{" "}
                  <span className="font-medium text-foreground">
                    {CATEGORIES.find(c => c.slug === selectedProvider?.provider_category)?.name || selectedProvider?.provider_category || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono:</span>{" "}
                  <span className="font-medium text-foreground">{selectedProvider?.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rating:</span>{" "}
                  <span className="font-medium text-foreground">
                    {Number(selectedProvider?.rating_avg || 0).toFixed(1)} ({selectedProvider?.review_count || 0} resenas)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trabajos:</span>{" "}
                  <span className="font-medium text-foreground">{selectedProvider?.completed_jobs || 0}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Bio:</span>{" "}
                  <span className="font-medium text-foreground">{selectedProvider?.bio || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Registrado:</span>{" "}
                  <span className="font-medium text-foreground">
                    {selectedProvider?.created_at ? new Date(selectedProvider.created_at).toLocaleDateString("es-AR") : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[16px] p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documentos ({docUrls.length})
              </h4>
              {docUrls.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">El prestador no subió documentos.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {docUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-border rounded-[16px] p-3 flex items-center gap-2.5 hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-sm transition-all text-sm group"
                    >
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-foreground group-hover:text-primary transition-colors">Documento {i + 1}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Notas de verificación</label>
              <Textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Observaciones sobre los documentos..."
                rows={2}
                className="rounded-[16px] border-border bg-card resize-none"
              />
            </div>

            {/* Verification Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate({ id: selectedProvider.id, status: "rejected", notes: verifyNotes })}
              >
                <Ban className="h-4 w-4 mr-1.5" /> Rechazar Prestador
              </Button>
              <Button
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-primary-foreground hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate({ id: selectedProvider.id, status: "approved", notes: verifyNotes })}
              >
                {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Aprobar Prestador
              </Button>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Antecedentes Penales Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[16px] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                  Antecedentes Penales
                </h4>
                {criminalStatusBadge(selectedProvider?.criminal_record_status)}
              </div>

              {/* Criminal record document */}
              {criminalDocUrl ? (
                <a
                  href={criminalDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 border border-border rounded-[16px] p-3 hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-sm transition-all text-sm group"
                >
                  <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0" />
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    Certificado de Antecedentes Penales
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">No se ha cargado certificado de antecedentes.</p>
              )}

              {/* Expiry date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Fecha de vencimiento
                </label>
                <Input
                  type="date"
                  value={criminalExpiry}
                  onChange={(e) => setCriminalExpiry(e.target.value)}
                  className="rounded-[16px] border-border bg-card max-w-xs h-10"
                />
              </div>

              {/* Criminal notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Notas sobre antecedentes</label>
                <Textarea
                  value={criminalNotes}
                  onChange={(e) => setCriminalNotes(e.target.value)}
                  placeholder="Observaciones sobre los antecedentes penales..."
                  rows={2}
                  className="rounded-[16px] border-border bg-card resize-none"
                />
              </div>

              {/* Criminal record actions */}
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  disabled={updateCriminalRecord.isPending}
                  onClick={() => updateCriminalRecord.mutate({
                    id: selectedProvider.id,
                    status: "rejected",
                    notes: criminalNotes,
                  })}
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Rechazar Antecedentes
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-primary-foreground hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  disabled={updateCriminalRecord.isPending}
                  onClick={() => updateCriminalRecord.mutate({
                    id: selectedProvider.id,
                    status: "approved",
                    notes: criminalNotes,
                    expiry: criminalExpiry || undefined,
                  })}
                >
                  {updateCriminalRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Aprobar Antecedentes
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-slate-800/30">
            <Button
              variant="outline"
              className="rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              onClick={() => { setSelectedProvider(null); setCriminalDocUrl(""); }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;
