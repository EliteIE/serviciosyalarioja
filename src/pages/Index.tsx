import { Link } from "react-router-dom";
import { Search, Star, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProviderCTA } from "@/components/home/ProviderCTA";
import { Hero } from "@/components/home/Hero";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { TestimoniosSection } from "@/components/home/TestimoniosSection";
import Seo from "@/components/Seo";

const Index = () => {
  return (
    <div>
      <Seo
        title="Servicios 360 — Profesionales verificados para tu hogar en La Rioja"
        description="Encontrá plomeros, electricistas, limpieza, pintura y más profesionales verificados en La Rioja. Presupuestos gratis, reseñas reales y pagos seguros con MercadoPago."
        canonicalPath="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Servicios 360",
          url: "https://www.servicios360.com.ar",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.servicios360.com.ar/buscar?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
          publisher: {
            "@type": "Organization",
            name: "Servicios 360",
            url: "https://www.servicios360.com.ar",
            logo: "https://www.servicios360.com.ar/logo.png",
            sameAs: [],
          },
        }}
      />
      {/* Hero */}
      <Hero />

      {/* Pequeña aclaración legal de cuotas — Res. BCRA 38.878 */}
      <div className="bg-secondary border-t border-secondary-foreground/10">
        <p className="container py-2 text-center text-[11px] text-secondary-foreground/50 leading-relaxed">
          * Cuotas sin interés sujetas a promociones vigentes de MercadoPago y bancos adheridos.
          Consultá el detalle al momento del pago.
        </p>
      </div>

      {/* Categories */}
      <CategoriesSection />

      {/* How it works */}
      <section className="bg-accent py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">¿Cómo funciona?</h2>
            <p className="text-muted-foreground mt-2">En 3 simples pasos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Search, title: "1. Buscá", desc: "Describí qué servicio necesitás y encontrá profesionales cerca tuyo." },
              { icon: Shield, title: "2. Elegí", desc: "Compará perfiles verificados, reseñas y presupuestos transparentes." },
              { icon: Star, title: "3. Contratá", desc: "Coordiná por chat, recibí el servicio y pagá de forma segura." },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary text-primary-foreground">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimoniosSection />

      {/* CTA */}
      <ProviderCTA />
    </div>
  );
};

export default Index;
