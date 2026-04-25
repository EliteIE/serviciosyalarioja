import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Real-photo category tiles. The 6 we have art for — other categories still
// live in /constants/categories.ts and show up on /buscar. Images ship in
// two widths via <img srcSet> so low-DPR phones don't download the 960
// variant. All imports are static so Vite hashes + emits them as assets.
import plomeria640 from "@/assets/categories/plomero-640.png";
import plomeria960 from "@/assets/categories/plomeria_960x1200.png";
import electricidad640 from "@/assets/categories/electricista-640.png";
import electricidad960 from "@/assets/categories/electricidad_960x1200.png";
import limpieza640 from "@/assets/categories/Limpieza-640.png";
import limpieza960 from "@/assets/categories/limpieza_960x1200.png";
import aire640 from "@/assets/categories/aireacondicionado-640.png";
import aire960 from "@/assets/categories/aire_acondicionado_960x1200.png";
import jardineria640 from "@/assets/categories/jardineria-640.png";
import jardineria960 from "@/assets/categories/jardineria_960x1200.png";
import carpinteria640 from "@/assets/categories/carpinteria-640.png";
import carpinteria960 from "@/assets/categories/carpinteria_960x1200.png";

type CategoryTile = {
  name: string;
  slug: string;
  src640: string;
  src960: string;
  alt: string;
};

const TILES: CategoryTile[] = [
  {
    name: "Plomería",
    slug: "plomeria",
    src640: plomeria640,
    src960: plomeria960,
    alt: "Plomero trabajando en una cañería",
  },
  {
    name: "Electricidad",
    slug: "electricidad",
    src640: electricidad640,
    src960: electricidad960,
    alt: "Electricista revisando un tablero",
  },
  {
    name: "Limpieza",
    slug: "limpieza",
    src640: limpieza640,
    src960: limpieza960,
    alt: "Servicio profesional de limpieza del hogar",
  },
  {
    name: "Aire Acondicionado",
    slug: "aire-acondicionado",
    src640: aire640,
    src960: aire960,
    alt: "Técnico instalando un equipo de aire acondicionado",
  },
  {
    name: "Jardinería",
    slug: "jardineria",
    src640: jardineria640,
    src960: jardineria960,
    alt: "Jardinero cuidando el pasto y las plantas",
  },
  {
    name: "Carpintería",
    slug: "carpinteria",
    src640: carpinteria640,
    src960: carpinteria960,
    alt: "Carpintero trabajando la madera",
  },
];

export const CategoriesSection = () => {
  return (
    <section className="bg-background py-16 md:py-24 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
              Categorías populares
            </h2>
            <p className="text-muted-foreground mt-3 text-base md:text-lg">
              Elegí el rubro y encontrá profesionales verificados cerca tuyo.
            </p>
          </div>

          <Link
            to="/buscar"
            className="hidden sm:inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors group"
          >
            Ver todas
            <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Tile grid — photo cards with gradient overlay for legibility */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {TILES.map((tile) => (
            <Link
              key={tile.slug}
              to={`/buscar?q=${encodeURIComponent(tile.name)}&category=${tile.slug}`}
              className="group relative block overflow-hidden rounded-2xl md:rounded-3xl aspect-[4/5] md:aspect-[5/4] bg-muted shadow-sm hover:shadow-2xl transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              aria-label={`Ver prestadores de ${tile.name}`}
            >
              <img
                src={tile.src640}
                srcSet={`${tile.src640} 640w, ${tile.src960} 960w`}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw"
                alt={tile.alt}
                loading="lazy"
                decoding="async"
                width={640}
                height={800}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Legibility gradient — stronger at bottom where the label sits */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/0"
                aria-hidden="true"
              />
              {/* Riojano accent strip (subtle local cue, only on hover) */}
              <div
                className="absolute inset-x-0 bottom-0 h-1 bg-riojano/80 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 flex items-end justify-between gap-3">
                <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-sm">
                  {tile.name}
                </h3>
                <span
                  className="shrink-0 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-secondary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-10 flex justify-center sm:hidden">
          <Link to="/buscar" className="w-full">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-card border border-border rounded-xl text-foreground font-semibold hover:bg-secondary transition-colors">
              Ver todas las categorías
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
};
