import { Link } from "react-router-dom";
import { Search, BarChart3, Handshake, Star, UserPlus, FileText, Bell, DollarSign } from "lucide-react";
import Seo from "@/components/Seo";

const clientSteps = [
  {
    icon: Search,
    title: "Busca",
    description: "Explorá nuestro directorio de profesionales verificados filtrando por categoría, zona y calificación.",
  },
  {
    icon: BarChart3,
    title: "Compara",
    description: "Revisá perfiles, portfolios, reseñas y calificaciones para elegir al mejor profesional para tu necesidad.",
  },
  {
    icon: Handshake,
    title: "Contrata",
    description: "Solicitá un presupuesto, acordá los detalles por chat y confirmá el servicio de forma segura.",
  },
  {
    icon: Star,
    title: "Califica",
    description: "Una vez completado el trabajo, dejá tu reseña para ayudar a otros usuarios y premiar al profesional.",
  },
];

const providerSteps = [
  {
    icon: UserPlus,
    title: "Registrate",
    description: "Creá tu cuenta gratuita como prestador en menos de 2 minutos. Sin costos ocultos.",
  },
  {
    icon: FileText,
    title: "Completa tu perfil",
    description: "Agregá tu experiencia, portfolio de trabajos, zona de cobertura y categoría de servicio.",
  },
  {
    icon: Bell,
    title: "Recibe pedidos",
    description: "Los clientes de tu zona te encuentran y te envían solicitudes de presupuesto directamente.",
  },
  {
    icon: DollarSign,
    title: "Cobra",
    description: "Acordá el precio con el cliente, realizá el trabajo y recibí tu pago de forma segura.",
  },
];

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Cómo funciona Servicios 360 — Para clientes y profesionales"
        description="Aprendé cómo usar Servicios 360: buscá profesionales verificados, compará presupuestos y pagá con MercadoPago. Si sos prestador, descubrí cómo sumarte y conseguir más clientes."
        canonicalPath="/como-funciona"
      />
      {/* Hero */}
      <div className="relative bg-secondary pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background opacity-90" />
        <div className="absolute right-0 top-0 -mt-20 -mr-20 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary-foreground tracking-tight mb-4">
            Como funciona <span className="text-primary">Servicios 360</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-foreground/80 max-w-2xl mx-auto">
            Conectamos clientes con profesionales de confianza de forma simple, rapida y segura.
          </p>
        </div>
      </div>

      {/* Client Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Para clientes
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Como funciona para vos
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            En 4 simples pasos, encontra al profesional ideal para tu necesidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {clientSteps.map((step, i) => (
            <div key={step.title} className="relative bg-card rounded-[24px] border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-[24px] bg-primary/10 flex items-center justify-center mx-auto mt-4 mb-4">
                <step.icon size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-border" />
      </div>

      {/* Provider Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-sm font-semibold mb-4">
            Para prestadores
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Como funciona para prestadores
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Empeza a recibir clientes nuevos en tu zona sin esfuerzo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {providerSteps.map((step, i) => (
            <div key={step.title} className="relative bg-card rounded-[24px] border border-border p-6 text-center hover:shadow-lg hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-[24px] bg-blue-500/10 flex items-center justify-center mx-auto mt-4 mb-4">
                <step.icon size={28} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-secondary rounded-[24px] p-8 md:p-12 text-center border border-border">
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary-foreground mb-4">
            Listo para empezar?
          </h2>
          <p className="text-secondary-foreground/80 mb-8 max-w-lg mx-auto">
            Ya sea que necesites un servicio o quieras ofrecer tus habilidades, Servicios 360 es el lugar indicado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/buscar">
              <button className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-[16px] transition-all duration-300 shadow-lg hover:shadow-xl">
                Buscar un profesional
              </button>
            </Link>
            <Link to="/registro/prestador">
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-secondary-foreground/5 text-secondary-foreground font-semibold rounded-[16px] transition-all duration-300 border border-secondary-foreground/20 hover:border-secondary-foreground/40">
                Registrarme como prestador
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
