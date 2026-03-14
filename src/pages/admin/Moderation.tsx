import { useState } from "react";
import { Shield, Eye, Trash2, CheckCircle2, Ban, Loader2, Star, Image, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminModeration = () => {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Fetch reviews with profiles
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name), reviewed:profiles!reviews_reviewed_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        // Fallback without joins if FK names differ
        const { data: fallback, error: e2 } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (e2) throw e2;
        return fallback;
      }
      return data;
    },
  });

  // Fetch pending providers
  const { data: pendingProviders } = useQuery({
    queryKey: ["admin-pending-providers"],
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
      // Admins need delete policy - for now use service role via edge function
      toast.info("Eliminación de reseñas requiere permisos de servicio");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setSelectedReview(null);
    },
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
      toast.success("Estado actualizado");
    },
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
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => verifyProvider.mutate({ id: p.id, verified: true })}>
                              <CheckCircle2 className="h-3 w-3" /> Aprobar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => verifyProvider.mutate({ id: p.id, verified: false })}>
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
          <Card>
            <CardContent className="p-0">
              {reviewsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !reviews?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin reseñas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comentario</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span>{r.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{r.comment || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(r.tags as string[] | null)?.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es")}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setSelectedReview(r)}>
                            <Eye className="h-3 w-3" /> Ver
                          </Button>
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
                    <Star key={s} className={`h-4 w-4 ${s <= selectedReview.rating ? "fill-primary text-primary" : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{new Date(selectedReview.created_at).toLocaleDateString("es")}</span>
              </div>
              <p className="text-sm">{selectedReview.comment || "Sin comentario"}</p>
              {selectedReview.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {selectedReview.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeration;
