import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Scale,
  Briefcase,
  CalendarDays,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientDisputes, type DisputeStatus } from "@/hooks/useDisputes";

const statusLabels: Record<DisputeStatus, string> = {
  abierta: "Abierta",
  en_revision: "En revisión",
  resuelta: "Resuelta",
};

const statusClasses: Record<DisputeStatus, string> = {
  abierta: "bg-red-500/10 text-red-600 dark:text-red-400",
  en_revision: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resuelta: "bg-green-500/10 text-green-600 dark:text-green-400",
};

const statusIcons: Record<DisputeStatus, typeof AlertTriangle> = {
  abierta: AlertTriangle,
  en_revision: Clock,
  resuelta: CheckCircle2,
};

export default function ClientDisputes() {
  const { data: disputes, isLoading } = useClientDisputes();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col pb-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mis Disputas</h1>
        <p className="text-sm text-muted-foreground">
          Reportes que abriste. Nuestro equipo revisa cada caso y te
          responderá por esta vía.
        </p>
      </div>

      {!disputes?.length ? (
        <Card className="rounded-[24px] border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-20 w-20 rounded-[24px] bg-secondary flex items-center justify-center mb-5">
              <Scale className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              Sin disputas
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-5">
              No abriste ningún reporte. Si tuviste un problema con un
              servicio, podés reportarlo desde "Mis Servicios".
            </p>
            <Link to="/cliente/servicios">
              <Button variant="outline" className="gap-1.5">
                Ir a Mis Servicios
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => {
            const Icon = statusIcons[d.status];
            return (
              <Card
                key={d.id}
                className="rounded-[24px] border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div
                      className={`h-11 w-11 rounded-[16px] flex items-center justify-center shrink-0 ${statusClasses[d.status]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-base font-bold text-foreground">
                          Disputa
                        </h3>
                        <Badge
                          className={`${statusClasses[d.status]} border-0 rounded-full px-3 py-0.5 text-xs font-semibold`}
                        >
                          {statusLabels[d.status]}
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {d.reason}
                      </p>

                      {d.service_title && (
                        <div className="mt-3 p-3 bg-secondary/50 rounded-[16px] flex items-center gap-3">
                          <div className="h-8 w-8 rounded-[16px] bg-primary/10 flex items-center justify-center shrink-0">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Servicio
                            </p>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {d.service_title}
                            </p>
                          </div>
                          {d.provider_name && (
                            <p className="text-xs text-muted-foreground shrink-0">
                              {d.provider_name}
                            </p>
                          )}
                        </div>
                      )}

                      {d.status === "resuelta" && d.resolution && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-[16px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1">
                            Resolución
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                            {d.resolution}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(d.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {d.amount != null && (
                          <span className="inline-flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="font-semibold text-foreground">
                              ${Number(d.amount).toLocaleString("es-AR")}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
