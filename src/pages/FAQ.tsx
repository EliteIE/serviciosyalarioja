import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle, Mail } from "lucide-react";
import Seo from "@/components/Seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT, buildWhatsAppLink } from "@/config/site";

/**
 * FAQ grouped by audience (Clientes / Prestadores / Pagos / Seguridad).
 * Each question is also emitted as FAQPage JSON-LD for Google rich results.
 */
const FAQ_DATA: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Para Clientes",
    items: [
      {
        q: "¿Cuánto cuesta usar Servicios 360?",
        a: "Para clientes, usar la plataforma es 100% gratis. Podés buscar profesionales, pedir presupuestos y contratar sin costo adicional. Solo pagás el precio acordado con el prestador.",
      },
      {
        q: "¿Cómo sé que el prestador es confiable?",
        a: "Todos los prestadores pasan por un proceso de verificación: comprobamos su identidad con DNI, revisamos documentación profesional (matrícula cuando corresponde) y validamos referencias. Además, podés leer reseñas reales de otros clientes en cada perfil.",
      },
      {
        q: "¿Qué pasa si el trabajo no queda bien?",
        a: "Primero, comunicate directamente con el prestador por el chat de la plataforma para resolverlo. Si no llegan a un acuerdo, podés abrir una disputa desde la sección 'Mis Servicios'. Nuestro equipo de moderación evalúa el caso y emite una resolución dentro de las 72 horas.",
      },
      {
        q: "¿Puedo pedir presupuesto sin obligación?",
        a: "Sí. Los presupuestos son gratuitos y sin compromiso. Recibís las propuestas, comparás precios y elegís al que más te convenga. No pagás nada hasta que aceptes un presupuesto.",
      },
      {
        q: "¿En qué zonas de La Rioja trabajan?",
        a: "Actualmente cubrimos toda la provincia de La Rioja: Capital, Chilecito, Chamical, Aimogasta, Nonogasta, Famatina y más localidades. Filtrá por tu barrio al buscar para ver prestadores cercanos.",
      },
    ],
  },
  {
    category: "Para Prestadores",
    items: [
      {
        q: "¿Cuánto cuesta registrarme como prestador?",
        a: "El registro es gratuito. Solo cobramos una comisión porcentual sobre los servicios completados a través de la plataforma. La comisión se informa claramente antes de aceptar cada presupuesto.",
      },
      {
        q: "¿Qué documentación necesito para verificar mi perfil?",
        a: "DNI y, según tu oficio, matrícula profesional habilitante. Para plomeros gasistas es obligatoria la matrícula del ENARGAS. Para electricistas, la matrícula correspondiente a tu provincia. Subís los documentos al registrarte y nuestro equipo los revisa en 24-48 hs hábiles.",
      },
      {
        q: "¿Cómo recibo los pagos?",
        a: "Podés recibir pagos por MercadoPago (acreditación en tu cuenta MP) o por transferencia bancaria (te mostramos el alias/CVU que cargaste). El cliente paga cuando el servicio está finalizado y confirmado.",
      },
      {
        q: "¿Tengo que facturar los servicios?",
        a: "Sí. Como prestador independiente, debés estar inscripto en ARCA (ex-AFIP) como monotributista o responsable inscripto según corresponda, y emitir factura por los servicios prestados. Servicios 360 no actúa como agente de retención.",
      },
    ],
  },
  {
    category: "Pagos y Seguridad",
    items: [
      {
        q: "¿Puedo pagar en cuotas?",
        a: "Sí, a través de MercadoPago podés pagar en cuotas con tarjeta de crédito. Las cuotas sin interés dependen de las promociones vigentes de MercadoPago y los bancos adheridos — el detalle se muestra al momento del pago.",
      },
      {
        q: "¿Es seguro pagar por la plataforma?",
        a: "Sí. Todos los pagos por MercadoPago están protegidos por el programa de protección al comprador. Para pagos por transferencia, el sistema valida la identidad del prestador antes de mostrarte su alias/CVU.",
      },
      {
        q: "¿Qué hago si tengo un problema con el pago?",
        a: "Contactanos por WhatsApp o email dentro de las 72 horas del incidente. También podés iniciar una disputa desde 'Mis Servicios' si el pago ya fue procesado pero el servicio no se ejecutó correctamente.",
      },
      {
        q: "¿Puedo arrepentirme después de contratar?",
        a: "Sí. Conforme al Art. 1110 del Código Civil y Comercial y la Ley 24.240, tenés 10 días corridos para ejercer tu derecho de arrepentimiento sobre servicios aún no ejecutados. Usá el Botón de Arrepentimiento en el footer.",
      },
    ],
  },
];

const FAQ = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    ),
  };

  return (
    <div className="container max-w-4xl py-12">
      <Seo
        title="Preguntas Frecuentes"
        description="Respuestas a las dudas más comunes sobre Servicios 360: cómo funciona, pagos, cuotas sin interés, seguridad, verificación de prestadores y más."
        canonicalPath="/preguntas-frecuentes"
        jsonLd={faqJsonLd}
      />

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
          <HelpCircle size={14} /> Centro de ayuda
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Preguntas Frecuentes</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Todo lo que necesitás saber para contratar o prestar servicios con tranquilidad.
        </p>
      </div>

      <div className="space-y-10">
        {FAQ_DATA.map((group) => (
          <section key={group.category}>
            <h2 className="text-xl font-bold mb-4 text-foreground">{group.category}</h2>
            <Accordion type="single" collapsible className="rounded-[16px] border border-border bg-card">
              {group.items.map((item, idx) => (
                <AccordionItem
                  key={item.q}
                  value={`${group.category}-${idx}`}
                  className="px-4 last:border-b-0"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      {/* Still-have-questions CTA */}
      <div className="mt-12 rounded-[24px] border-2 border-primary/20 bg-primary/5 p-6 md:p-8 text-center">
        <h3 className="text-xl font-bold mb-2">¿No encontraste tu respuesta?</h3>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Nuestro equipo está listo para ayudarte. Respondemos por WhatsApp o email.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={buildWhatsAppLink("Hola, tengo una consulta sobre Servicios 360.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#25D366] hover:bg-[#20BA5A] text-primary-foreground font-semibold px-5 py-3 transition-colors"
          >
            <MessageCircle size={18} /> Preguntá por WhatsApp
          </a>
          <Link
            to="/contacto"
            className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-border bg-card hover:bg-muted font-semibold px-5 py-3 transition-colors"
          >
            <Mail size={18} /> Escribinos un email
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          También podés escribir directamente a {CONTACT.email}
        </p>
      </div>
    </div>
  );
};

export default FAQ;
