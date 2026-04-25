import { Link } from "react-router-dom";
import { CATEGORIES } from "@/constants/categories";
import { SITE, CONTACT, LEGAL, SOCIAL, buildWhatsAppLink } from "@/config/site";
import logo from "@/assets/logo.png";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  MapPin,
  Scale,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-secondary-foreground/10 text-secondary-foreground">
      {/* Secção Principal do Rodapé */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Coluna 1: Marca e Proposta de Valor */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img
                src={logo}
                alt="Servicios 360"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="h-10 w-10 rounded-[16px] shadow-lg"
              />
              <span className="text-2xl font-bold tracking-tight text-secondary-foreground">
                Servicios <span className="text-primary">360</span>
              </span>
            </div>
            <p className="text-secondary-foreground/70 leading-relaxed mb-6 max-w-sm">
              La plataforma de servicios profesionales verificados en{" "}
              <strong className="text-secondary-foreground">La Rioja</strong>.
              Conectamos talento local con clientes que buscan calidad y confianza.
            </p>

            {/* WhatsApp + Email directos */}
            <div className="space-y-2 mb-6">
              <a
                href={buildWhatsAppLink("Hola, quiero hacer una consulta sobre Servicios 360.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <MessageCircle size={16} className="text-green-500" />
                {CONTACT.whatsappDisplay}
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <Mail size={16} />
                {CONTACT.email}
              </a>
              <p className="flex items-center gap-2 text-sm text-secondary-foreground/80">
                <MapPin size={16} />
                {SITE.region}, Argentina
              </p>
            </div>
          </div>

          {/* Coluna 2: Categorias */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide text-secondary-foreground">Categorías</h3>
            <ul className="space-y-4">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/buscar?category=${cat.slug}`}
                    className="text-secondary-foreground/80 hover:text-primary transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/30 group-hover:bg-primary transition-colors"></span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Empresa */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide text-secondary-foreground">Empresa</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/nosotros"
                  className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors text-sm font-medium"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  to="/como-funciona"
                  className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors text-sm font-medium"
                >
                  Cómo Funciona
                </Link>
              </li>
              <li>
                <Link
                  to="/preguntas-frecuentes"
                  className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors text-sm font-medium"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link
                  to="/contacto"
                  className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors text-sm font-medium"
                >
                  Contacto y Soporte
                </Link>
              </li>
              <li>
                <Link
                  to="/registro/prestador"
                  className="text-secondary-foreground/80 hover:text-primary transition-colors text-sm font-medium"
                >
                  Ofrecer Servicios
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Newsletter + Social */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide text-secondary-foreground">Suscribite</h3>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Recibí consejos para tu hogar y ofertas exclusivas.
            </p>
            <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground/50"
                  size={18}
                />
                <label htmlFor="newsletter-email" className="sr-only">
                  Email para newsletter
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Tu email..."
                  className="w-full bg-secondary-foreground/5 border border-secondary-foreground/20 rounded-[16px] pl-10 pr-12 py-3 text-sm text-secondary-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary-foreground/50"
                />
                <button
                  type="submit"
                  aria-label="Suscribirme al newsletter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary hover:bg-primary/90 rounded-[16px] flex items-center justify-center text-primary-foreground transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <h3 className="font-bold mb-4 tracking-wide text-secondary-foreground">Seguinos</h3>
            <div className="flex gap-3">
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Servicios 360"
                className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20"
              >
                <Facebook size={18} />
              </a>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Servicios 360"
                className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20"
              >
                <Instagram size={18} />
              </a>
              <a
                href={SOCIAL.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter de Servicios 360"
                className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20"
              >
                <Twitter size={18} />
              </a>
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn de Servicios 360"
                className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bloco Legal-AR (Compliance) — Ley 24.240 + Res. SC 424/2020 */}
      <div className="border-t border-secondary-foreground/10 bg-secondary-foreground/[0.03]">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-secondary-foreground/70 shrink-0" />
              <div className="text-xs text-secondary-foreground/70 leading-relaxed">
                <strong className="text-secondary-foreground">Defensa del Consumidor</strong>{" "}
                (Ley 24.240).{" "}
                <a
                  href={LEGAL.defensaConsumidor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Conocé tus derechos →
                </a>
              </div>
            </div>

            {/* Botón de Arrepentimiento — obligatorio Res. SC 424/2020 */}
            <Link
              to="/arrepentimiento"
              className="inline-flex items-center gap-2 rounded-[16px] border-2 border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
            >
              <ShieldCheck size={16} />
              Botón de Arrepentimiento
            </Link>
          </div>
        </div>
      </div>

      {/* Barra Inferior (Sub-footer) */}
      <div className="border-t border-secondary-foreground/10 bg-secondary-foreground/5">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-secondary-foreground">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs text-secondary-foreground/70 text-center md:text-left">
            <p>© 2026 {LEGAL.razonSocial}. Todos los derechos reservados.</p>
            <span className="hidden md:inline w-1 h-1 rounded-full bg-secondary-foreground/30"></span>
            <p className="text-secondary-foreground/60">CUIT: {LEGAL.cuit}</p>
            <span className="hidden md:inline w-1 h-1 rounded-full bg-secondary-foreground/30"></span>
            <div className="flex items-center gap-3">
              <Link to="/terminos" className="hover:text-secondary-foreground transition-colors">
                Términos
              </Link>
              <Link to="/privacidad" className="hover:text-secondary-foreground transition-colors">
                Privacidad
              </Link>
              <Link
                to="/arrepentimiento"
                className="hover:text-secondary-foreground transition-colors"
              >
                Arrepentimiento
              </Link>
            </div>
          </div>

          {/* Trust Badges — concretos, no vagos */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 text-secondary-foreground/80 text-xs font-medium px-3 py-1.5 rounded-[16px] bg-secondary-foreground/5 border border-secondary-foreground/20">
              <ShieldCheck size={14} className="text-green-500" />
              <span>Verificación con DNI</span>
            </div>
            <div className="flex items-center gap-1.5 text-secondary-foreground/80 text-xs font-medium px-3 py-1.5 rounded-[16px] bg-secondary-foreground/5 border border-secondary-foreground/20">
              <ShieldCheck size={14} className="text-[#00A8E1]" />
              <span>Pagos MercadoPago</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
