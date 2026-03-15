import { useState } from "react";
import { Shield, Trash2, CheckCircle2, Ban, Loader2, Star, Eye, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminModeration = () => {
  const queryClient = useQueryClient();
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderación de Contenido</h1>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers" className="gap-1">
            <Shield className="h-4 w-4" /> Prestadores Pendientes
            {pendingProviders?.length ? <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingProviders.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1">
            <Star className="h-4 w-4" /> Reseñas
            {reviews?.filter(r => r.rating <= 2).length ? (
              <Badge className="ml-1 h-5 px-1.5 text-xs bg-warning/20 text-warning">{reviews.filter(r => r.rating <= 2).length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardContent className="p-0">
              {!pendingProviders?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay prestadores pendientes de verificación</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProviders.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name}</TableCell>
                        <TableCell>{p.provider_category || "—"}</TableCell>
                        <TableCell>{p.phone || "—"}</TableCell>
                        <TableCell>
                          {(p.provider_doc_urls as string[] | null)?.length ? (
                            <Badge variant="outline">{(p.provider_doc_urls as string[]).length} docs</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin docs</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => verifyProvider.mutate({ id: p.id, verified: true })} disabled={verifyProvider.isPending}>
                              <CheckCircle2 className="h-3 w-3" /> Aprobar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => verifyProvider.mutate({ id: p.id, verified: false })} disabled={verifyProvider.isPending}>
                              <Ban className="h-3 w-3" /> Rechazar
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
        </TabsContent>

        <TabsContent value="reviews">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{filteredReviews?.length || 0} reseñas</p>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las reseñas</SelectItem>
                <SelectItem value="bad">Negativas (1-2 ★)</SelectItem>
                <SelectItem value="good">Positivas (4-5 ★)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {reviewsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !filteredReviews?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin reseñas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead>De → Para</TableHead>
                      <TableHead>Comentario</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((r: any) => (
                      <TableRow key={r.id} className={r.rating <= 2 ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className={`h-3 w-3 ${r.rating <= 2 ? "fill-destructive text-destructive" : "fill-primary text-primary"}`} />
                            <span className="font-medium">{r.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span>{r.reviewer?.full_name || "—"}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span>{r.reviewed?.full_name || "—"}</span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{r.comment || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(r.tags as string[] | null)?.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-AR")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setSelectedReview(r)}>
                              <Eye className="h-3 w-3" /> Ver
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => setDeleteTarget(r)}>
                              <Trash2 className="h-3 w-3" />
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
        </TabsContent>
      </Tabs>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(o) => !o && setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Reseña</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= selectedReview.rating ? (selectedReview.rating <= 2 ? "fill-destructive text-destructive" : "fill-primary text-primary") : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{new Date(selectedReview.created_at).toLocaleDateString("es-AR")}</span>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">De:</span> {selectedReview.reviewer?.full_name || "—"}</p>
                <p><span className="text-muted-foreground">Para:</span> {selectedReview.reviewed?.full_name || "—"}</p>
              </div>
              <p className="text-sm">{selectedReview.comment || "Sin comentario"}</p>
              {selectedReview.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {selectedReview.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="sm" onClick={() => { setSelectedReview(null); setDeleteTarget(selectedReview); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar reseña</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta reseña de {deleteTarget?.reviewer?.full_name || "un usuario"} ({deleteTarget?.rating} estrella{deleteTarget?.rating !== 1 ? "s" : ""}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteReview.mutate(deleteTarget.id)}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModeration;
