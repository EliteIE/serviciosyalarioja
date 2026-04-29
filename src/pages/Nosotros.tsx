import { Link } from "react-router-dom";
import { PROVIDER_INTAKE_PATH } from "@/constants/external";
import {
  MapPin,
  Heart,
  ShieldCheck,
  Users,
  Target,
  Sparkles,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { SITE, LEGAL } from "@/config/site";

const VALORES = [
  {
    icon: Heart,
    title: "Cercanía local",
    desc:
      "Somos de acá. Entendemos cómo se resuelven las cosas en La Rioja y respetamos los tiempos de nuestra gente.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza verificada",
    desc:
      "Cada prestador pasa por un proceso real de verificación: identidad, documentación y referencias.",
  },
  {
    icon: Sparkles,
    title: "Simplicidad",
    desc:
      "Sin vueltas: buscás, pedís presupuesto, elegís. Sin llamados de más, sin pérdida de tiempo.",
  },
  {
    icon: Users,
    title: "Comunidad",
    desc:
      "Conectamos vecinos con profesionales de tu zona. Cada contratación fortalece la economía local.",
  },
];

const Nosotros = () => {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: LEGAL.razonSocial,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    description: SITE.description,
    areaServed: {
      "@type": "State",
      name: SITE.region,
      containedInPlace: { "@type": "Country", name: SITE.country },
    },
    foundingDate: "2026",
  };

  return (
    <div className="container max-w-5xl py-12">
      <Seo
        title="Sobre Nosotros"
        description="Conocé la historia de Servicios 360: la plataforma riojana que conecta profesionales verificados con vecinos que buscan calidad y confianza. Empezamos en La Rioja, crecemos con vos."
        canonicalPath="/nosotros"
        jsonLd={orgJsonLd}
      />

      {/* Hero */}
      <section className="text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
          <MapPin size={14} /> Hecho en La Rioja
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Conectamos <span className="text-primary">talento local</span>
          <br className="hidden md:block" /> con hogares riojanos.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Servicios 360 nació de una idea simple: en La Rioja hay grandes profesionales,
          y gente que los necesita. Nuestro trabajo es ponerlos en contacto, con
          transparencia y confianza.
        </p>
      </section>

      {/* Nuestra Historia */}
      <section className="grid md:grid-cols-2 gap-10 mb-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-3">
            <Target size={16} /> Nuestra historia
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Empezamos en nuestra ciudad, como vecinos.
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Todos pasamos por lo mismo: se rompe una canilla un domingo, se corta la
              luz un feriado, hay que pintar antes de mudarse y no sabés a quién llamar.
              Pedís en grupos de WhatsApp, llamás conocidos, recibís recomendaciones que
              no siempre se confirman.
            </p>
            <p>
              Pensamos que tenía que haber una forma mejor. Una plataforma donde cada
              profesional estuviera <strong className="text-foreground">realmente verificado</strong>,
              donde las reseñas fueran <strong className="text-foreground">reales</strong>, y
              donde pedir presupuesto no significara dejar tu número de teléfono a un desconocido.
            </p>
            <p>
              Así nació Servicios 360. Arrancamos en <strong className="text-foreground">La Rioja Capital</strong>{" "}
              porque es donde vivimos, es donde conocemos a la gente y es donde queríamos
              que funcione primero. Después vienen Chilecito, Chamical, Aimogasta... y
              todo el país.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-secondary p-8">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">Los oficios</p>
              <p className="text-sm text-secondary-foreground/70 mt-1">que más se necesitan</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">Verificados</p>
              <p className="text-sm text-secondary-foreground/70 mt-1">Identidad y matrícula cuando corresponde</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">Gratis</p>
              <p className="text-sm text-secondary-foreground/70 mt-1">Para clientes, siempre</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">Ágil</p>
              <p className="text-sm text-secondary-foreground/70 mt-1">Cotizás el mismo día</p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Nuestros valores</h2>
          <p className="text-muted-foreground">Lo que nos mueve, todos los días.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {VALORES.map((v) => (
            <div
              key={v.title}
              className="flex gap-4 rounded-[24px] border border-border bg-card p-6"
            >
              <div className="rounded-[16px] bg-primary/10 p-3 h-12 w-12 shrink-0 flex items-center justify-center">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nuestra Misión */}
      <section className="rounded-[24px] bg-secondary text-secondary-foreground p-8 md:p-12 mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Nuestra misión</h2>
          <p className="text-lg md:text-xl leading-relaxed text-secondary-foreground/90 mb-8">
            Hacer que contratar un servicio profesional sea tan simple como pedir un delivery,
            pero con la confianza de conocer a quién contratás.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              "Bajar el tiempo de encontrar un profesional de horas a minutos",
              "Garantizar que cada prestador esté verificado y sea transparente",
              "Devolverle a la economía local lo que genera la plataforma",
            ].map((m) => (
              <div key={m} className="flex gap-2 items-start">
                <CheckCircle2
                  size={18}
                  className="text-primary shrink-0 mt-0.5"
                />
                <p className="text-sm text-secondary-foreground/80">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center rounded-[24px] border-2 border-primary/20 bg-primary/5 p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Sumate a la comunidad de Servicios 360.
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Ya sea que busques contratar o quieras ofrecer tus servicios, empezar es gratis y lleva menos de 2 minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-[16px]">
            <Link to="/registro/cliente">Registrate como Cliente</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-[16px]">
            <Link to={PROVIDER_INTAKE_PATH}>
              <Briefcase className="mr-2 h-4 w-4" /> Ofrecer Servicios
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Nosotros;
