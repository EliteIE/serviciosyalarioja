import { Link } from "react-router-dom";
import { CATEGORIES } from "@/constants/categories";
import logo from "@/assets/logo.png";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Mail, 
  ArrowRight,
  ShieldCheck
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
              <img src={logo} alt="Servicios 360" className="h-10 w-10 rounded-xl shadow-lg" />
              <span className="text-2xl font-bold tracking-tight text-secondary-foreground">
                Servicios <span className="text-primary">360</span>
              </span>
            </div>
            <p className="text-secondary-foreground/70 leading-relaxed mb-8 max-w-sm">
              La plataforma líder en servicios profesionales verificados. Conectamos talento local con clientes que buscan calidad y confianza.
            </p>
          </div>

          {/* Coluna 2: Categorias */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide text-secondary-foreground">Categorías</h3>
            <ul className="space-y-4">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/buscar?category=${cat.slug}`} className="text-secondary-foreground/80 hover:text-primary transition-colors text-sm font-medium flex items-center gap-2 group">
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
              {['Sobre Nosotros', 'Cómo Funciona', 'Preguntas Frecuentes', 'Centro de Ayuda', 'Contacto'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors text-sm font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Legal & Newsletter */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide text-secondary-foreground">Suscribite</h3>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Recibí consejos para tu hogar y ofertas exclusivas de servicios.
            </p>
            <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground/50" size={18} />
                <input 
                  type="email" 
                  placeholder="Tu email..." 
                  className="w-full bg-secondary-foreground/5 border border-secondary-foreground/20 rounded-xl pl-10 pr-12 py-3 text-sm text-secondary-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary-foreground/50"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-primary-foreground transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <h3 className="font-bold mb-4 tracking-wide text-secondary-foreground">Seguinos</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/5 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all transform hover:-translate-y-1 border border-secondary-foreground/20">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Barra Inferior (Sub-footer) */}
      <div className="border-t border-secondary-foreground/10 bg-secondary-foreground/5">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-secondary-foreground">
          
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-sm text-secondary-foreground/70 text-center md:text-left">
            <p>© 2026 Servicios 360. Todos los derechos reservados.</p>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/terminos" className="hover:text-secondary-foreground transition-colors">Términos y Condiciones</Link>
              <span className="w-1 h-1 rounded-full bg-secondary-foreground/30"></span>
              <Link to="/privacidad" className="hover:text-secondary-foreground transition-colors">Política de Privacidad</Link>
            </div>
          </div>

          <p className="text-secondary-foreground/60 text-xs md:hidden text-center">
            Desarrollada por Elite - Inteligência Empresarial
          </p>

          {/* Trust Badges */}
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-secondary-foreground/60 text-sm">
              Desarrollada por Elite - Inteligência Empresarial
            </span>
            <div className="flex items-center gap-1.5 text-secondary-foreground/80 text-sm font-medium px-3 py-1.5 rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/20">
              <ShieldCheck size={16} className="text-green-500" />
              <span>Plataforma Segura</span>
            </div>
          </div>

        </div>
      </div>
      
    </footer>
  );
};

export default Footer;
