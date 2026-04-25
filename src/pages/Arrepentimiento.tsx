import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Mail, MessageCircle } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { CONTACT, LEGAL, buildWhatsAppLink } from "@/config/site";

/**
 * Botón de Arrepentimiento — Res. SC 424/2020.
 * All e-commerce platforms operating in Argentina are legally required to
 * provide a prominent, accessible mechanism for consumers to exercise their
 * right of withdrawal within 10 calendar days of contracting a service
 * (Art. 1110 Código Civil y Comercial + Ley 24.240 Art. 34).
 *
 * Even though Servicios 360 acts as an intermediary (not the direct service
 * provider), the platform itself is liable for providing this mechanism to
 * anyone who contracted a service through it.
 */
const Arrepentimiento = () => {
  const waMessage =
    "Hola, quiero ejercer mi derecho de arrepentimiento sobre un servicio contratado en Servicios 360.";

  return (
    <div className="container max-w-3xl py-12">
      <Seo
        title="Botón de Arrepentimiento"
        description="Ejercé tu derecho de arrepentimiento (Ley 24.240 Art. 34 y Res. SC 424/2020). Tenés 10 días corridos para cancelar servicios contratados en Servicios 360."
        canonicalPath="/arrepentimiento"
      />

      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} /> Volver al inicio
      </Link>

      <div className="rounded-[24px] border-2 border-primary/20 bg-primary/5 p-6 mb-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Botón de Arrepentimiento
            </h1>
            <p className="text-foreground/80">
              Esta página cumple con la <strong>Resolución 424/2020</strong> de la
              Secretaría de Comercio Interior de la Nación Argentina.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-6 text-foreground/90">
        <div>
          <h2 className="text-xl font-semibold mb-3">¿Qué es el derecho de arrepentimiento?</h2>
          <p>
            Conforme al <strong>Art. 1110 del Código Civil y Comercial</strong> y al{" "}
            <strong>Art. 34 de la Ley 24.240</strong> de Defensa del Consumidor,
            tenés derecho a revocar la aceptación de la contratación de un
            servicio dentro de los <strong>10 días corridos</strong> contados a
            partir de la celebración del contrato o de la recepción del servicio,
            lo que ocurra último, <strong>sin responsabilidad alguna</strong>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">¿En qué casos aplica?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Servicios contratados a través de Servicios 360 que aún{" "}
              <strong>no hayan sido ejecutados</strong>.
            </li>
            <li>
              Comisiones cobradas por la Plataforma sobre servicios no prestados.
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-[16px] p-3">
            <strong>Importante:</strong> si el servicio ya fue ejecutado total o
            parcialmente por el Prestador, corresponde abrir una disputa dentro
            de la Plataforma (no aplica el arrepentimiento, sino los mecanismos
            de resolución de conflictos).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">¿Cómo ejerzo mi derecho?</h2>
          <p className="mb-4">
            Podés ejercer tu derecho de arrepentimiento por cualquiera de estos
            canales, sin necesidad de justificar el motivo:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href={buildWhatsAppLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-[16px] border border-border p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="rounded-full bg-green-500/10 p-2 shrink-0">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">WhatsApp</p>
                <p className="text-xs text-muted-foreground">{CONTACT.whatsappDisplay}</p>
              </div>
            </a>
            <a
              href={`mailto:${CONTACT.email}?subject=Ejercicio%20de%20derecho%20de%20arrepentimiento`}
              className="flex items-center gap-3 rounded-[16px] border border-border p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="rounded-full bg-primary/10 p-2 shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Email</p>
                <p className="text-xs text-muted-foreground break-all">{CONTACT.email}</p>
              </div>
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">¿Qué datos necesito enviar?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Nombre y apellido completo.</li>
            <li>DNI o identificación con la que te registraste.</li>
            <li>Email de la cuenta en Servicios 360.</li>
            <li>Fecha de contratación del servicio.</li>
            <li>
              ID de la solicitud o presupuesto (podés encontrarlo en{" "}
              <em>"Mis Servicios"</em>).
            </li>
            <li>Medio por el cual querés recibir el reintegro (si corresponde).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Plazos de respuesta y reintegro</h2>
          <p>
            Procesaremos tu solicitud dentro de las <strong>72 horas hábiles</strong> de
            recibida. Si corresponde un reintegro, lo acreditaremos por el mismo
            medio de pago utilizado dentro de los <strong>30 días corridos</strong>,
            sin costo adicional.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Autoridades de aplicación</h2>
          <p>
            Si considerás que tus derechos como consumidor no fueron respetados,
            podés realizar un reclamo ante:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <a
                href={LEGAL.defensaConsumidor}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Dirección Nacional de Defensa del Consumidor
              </a>{" "}
              (Ley 24.240).
            </li>
            <li>
              <a
                href={LEGAL.aaip}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Agencia de Acceso a la Información Pública (AAIP)
              </a>{" "}
              para reclamos sobre datos personales (Ley 25.326).
            </li>
            <li>Oficina Municipal de Información al Consumidor (OMIC) de tu localidad.</li>
          </ul>
        </div>

        <div className="pt-6 border-t border-border">
          <Button asChild className="rounded-[16px]">
            <a href={buildWhatsAppLink(waMessage)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Iniciar arrepentimiento por WhatsApp
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Arrepentimiento;
