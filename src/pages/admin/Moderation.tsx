import { useState } from "react";
import { Shield, Trash2, CheckCircle2, Ban, Loader2, Star, Eye, AlertTriangle, MessageSquareWarning, UserCheck, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminModeration = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"providers" | "reviews">("providers");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Fetch reviews with profiles
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin-reviews"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name), reviewed:profiles!reviews_reviewed_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        const { data: fallback, error: e2 } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (e2) throw e2;
        return fallback;
      }
      return data;
    },
  });

  // Fetch pending providers
  const { data: pendingProviders } = useQuery({
    queryKey: ["admin-pending-providers"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_provider", true)
        .eq("provider_verified", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setDeleteTarget(null);
      setSelectedReview(null);
      toast.success("Reseña eliminada correctamente");
    },
    onError: (err: Error) => toast.error("Error al eliminar: " + err.message),
  });

  const verifyProvider = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          provider_verified: verified,
          provider_verification_status: verified ? "approved" : "rejected",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Estado actualizado");
    },
  });

  const filteredReviews = reviews?.filter(r => {
    if (ratingFilter === "all") return true;
    if (ratingFilter === "bad") return r.rating <= 2;
    if (ratingFilter === "good") return r.rating >= 4;
    return true;
  });

  const badReviewsCount = reviews?.filter(r => r.rating <= 2).length || 0;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Moderación de Contenido
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestiona verificaciones de prestadores y modera reseñas de la plataforma.
        </p>
      </div>

      {/* Custom Filter Pills */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab("providers")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === "providers"
              ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <Shield className="h-4 w-4" />
          Prestadores Pendientes
          {pendingProviders?.length ? (
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs font-bold px-1.5">
              {pendingProviders.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === "reviews"
              ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <Star className="h-4 w-4" />
          Reseñas
          {badReviewsCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-amber-500 text-white text-xs font-bold px-1.5">
              {badReviewsCount}
            </span>
          )}
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === "providers" && (
        <Card className="rounded-3xl shadow-lg border-0 dark:bg-slate-900">
          <CardContent className="p-0">
            {!pendingProviders?.length ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <UserCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Todo al día</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">No hay prestadores pendientes de verificación</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-6">Prestador</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Categoría</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Teléfono</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Documentos</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fecha Registro</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProviders.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                              {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{p.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{p.provider_category || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{p.phone || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {(p.provider_doc_urls as string[] | null)?.length ? (
                          <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            {(p.provider_doc_urls as string[]).length} docs
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Sin docs</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-400 dark:text-slate-500">
                          {new Date(p.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 px-3 shadow-sm"
                            onClick={() => verifyProvider.mutate({ id: p.id, verified: true })}
                            disabled={verifyProvider.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 px-3 shadow-sm"
                            onClick={() => verifyProvider.mutate({ id: p.id, verified: false })}
                            disabled={verifyProvider.isPending}
                          >
                            <Ban className="h-3.5 w-3.5" /> Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {filteredReviews?.length || 0} reseña{(filteredReviews?.length || 0) !== 1 ? "s" : ""}
            </p>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-48 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                <SelectValue placeholder="Filtrar por rating" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas las reseñas</SelectItem>
                <SelectItem value="bad">Negativas (1-2 ★)</SelectItem>
                <SelectItem value="good">Positivas (4-5 ★)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="rounded-3xl shadow-lg border-0 dark:bg-slate-900">
            <CardContent className="p-0">
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <p className="text-sm text-slate-400 mt-3">Cargando reseñas...</p>
                </div>
              ) : !filteredReviews?.length ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Sin reseñas</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">No se encontraron reseñas con los filtros actuales</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-6">Rating</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">De → Para</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Comentario</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tags</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pr-6">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((r: any) => (
                      <TableRow
                        key={r.id}
                        className={`transition-colors border-b border-slate-50 dark:border-slate-800/50 ${
                          r.rating <= 2
                            ? "bg-red-50/60 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-1.5">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= r.rating
                                      ? r.rating <= 2
                                        ? "fill-red-500 text-red-500"
                                        : "fill-amber-400 text-amber-400"
                                      : "text-slate-200 dark:text-slate-700"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{r.reviewer?.full_name || "—"}</span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">→</span>
                            <span className="text-slate-600 dark:text-slate-400">{r.reviewed?.full_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{r.comment || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(r.tags as string[] | null)?.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs rounded-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700">{t}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-400 dark:text-slate-500">{new Date(r.created_at).toLocaleDateString("es-AR")}</span>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-xl text-xs gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                              onClick={() => setSelectedReview(r)}
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-xl text-xs gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => setDeleteTarget(r)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(o) => !o && setSelectedReview(null)}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl dark:bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Detalle de Reseña</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-5 w-5 ${
                        s <= selectedReview.rating
                          ? selectedReview.rating <= 2
                            ? "fill-red-500 text-red-500"
                            : "fill-amber-400 text-amber-400"
                          : "text-slate-200 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1">
                  {new Date(selectedReview.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">De:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedReview.reviewer?.full_name || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Para:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedReview.reviewed?.full_name || "—"}</span>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedReview.comment || "Sin comentario"}
              </p>

              {selectedReview.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {selectedReview.tags.map((t: string) => (
                    <Badge key={t} variant="outline" className="rounded-full text-xs bg-slate-50 dark:bg-slate-800 dark:border-slate-700">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 pt-2">
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
              size="sm"
              onClick={() => { setSelectedReview(null); setDeleteTarget(selectedReview); }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setSelectedReview(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl dark:bg-slate-900">
          <AlertDialogHeader>
            <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
              <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold text-slate-900 dark:text-white">
              Eliminar reseña
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente esta reseña de{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteTarget?.reviewer?.full_name || "un usuario"}</span>{" "}
              ({deleteTarget?.rating} estrella{deleteTarget?.rating !== 1 ? "s" : ""}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-center pt-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-sm"
              onClick={() => deleteReview.mutate(deleteTarget.id)}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModeration;
