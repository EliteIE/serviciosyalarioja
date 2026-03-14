import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  Wrench, 
  Sparkles, 
  Zap,
  Quote,
  EyeOff,
  Eye,
  Loader2,
  Briefcase
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useReviews } from "@/hooks/useReviews";

export default function ClientReviews() {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useReviews(user?.id ?? null);

  // Estado para simular o ver a página com/sem dados manualmente
  const [forceEmptyState, setForceEmptyState] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const hasData = !forceEmptyState && reviews && reviews.length > 0;

  // Cálculos Reales de Estadísticas
  const averageRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
    
  const stats = {
    promedio: averageRating,
    total: reviews?.length || 0,
    distribucion: [5, 4, 3, 2, 1].map(stars => ({
      estrellas: stars,
      cantidad: reviews?.filter(r => r.rating === stars).length || 0
    }))
  };

  // Helper para asignar Íconos y Colores según la categoría real de la BD
  const getCategoryTheme = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('limpieza')) return { icon: Sparkles, color: 'text-orange-500' };
    if (cat.includes('electricidad') || cat.includes('clima')) return { icon: Zap, color: 'text-blue-500' };
    if (cat.includes('plomería')) return { icon: Wrench, color: 'text-sky-500' };
    return { icon: Briefcase, color: 'text-slate-500' };
  };

  // Componente auxiliar para renderizar estrelas
  const StarDisplay = ({ rating, size = 16 }: { rating: number, size?: number }) => {
    return (
      <div className="flex items-center gap-0.5 text-orange-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={size} 
            fill={star <= rating ? 'currentColor' : 'none'} 
            className={star <= rating ? 'text-orange-400' : 'text-slate-200'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 font-sans flex flex-col -mx-4 sm:-mx-6 md:mx-0 rounded-lg overflow-hidden">
      
      {/* Cabeçalho da Página */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 flex-shrink-0 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Reseñas</h1>
          <p className="text-sm text-slate-500 hidden sm:block">Reseñas que te dejaron los prestadores tras cada servicio</p>
        </div>
        
        {/* Botão de Teste (Apenas para ver os dois estados) */}
        <button 
          onClick={() => setForceEmptyState(!forceEmptyState)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-lg transition-colors"
        >
          {forceEmptyState ? <Eye size={16} /> : <EyeOff size={16} />}
          <span className="hidden sm:inline">{forceEmptyState ? 'Ver con datos' : 'Ver estado vacío'}</span>
        </button>
      </header>

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {hasData ? (
          /* ESTADO COM DADOS (O que o utilizador verá quando tiver avaliações) */
          <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            
            {/* Bloco de Resumo (KPIs Premium) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
              
              {/* Pontuação Global */}
              <div className="flex flex-col items-center justify-center min-w-[150px]">
                <h2 className="text-5xl font-extrabold text-slate-800 tracking-tight">{stats.promedio.toFixed(1)}</h2>
                <div className="my-2">
                  <StarDisplay rating={Math.round(stats.promedio)} size={20} />
                </div>
                <p className="text-sm text-slate-500 font-medium">{stats.total} reseñas en total</p>
              </div>

              <div className="hidden md:block w-px h-24 bg-slate-100"></div>

              {/* Barras de Distribuição */}
              <div className="flex-1 w-full space-y-2.5">
                {stats.distribucion.map((item) => {
                  const percentage = stats.total > 0 ? (item.cantidad / stats.total) * 100 : 0;
                  return (
                    <div key={item.estrellas} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 text-sm font-semibold text-slate-600">
                        {item.estrellas} <Star size={14} className="text-slate-400" fill="currentColor" />
                      </div>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-sm text-slate-500">{item.cantidad}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista de Avaliações */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Tus reseñas recientes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((resena) => {
                  const { icon: Icon, color } = getCategoryTheme(resena.service_category);
                  const prestador = resena.reviewer_name || "Usuario Anónimo";
                  const initial = prestador.charAt(0).toUpperCase();

                  return (
                    <div key={resena.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col group relative overflow-hidden">
                      
                      {/* Efeito decorativo de aspas */}
                      <Quote size={80} className="absolute -top-4 -right-4 text-slate-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform" />
                      
                      <div className="relative z-10 flex-1">
                        {/* Header do Cartão */}
                        <div className="flex justify-between items-start mb-4">
                          <StarDisplay rating={resena.rating} />
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            {new Date(resena.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Comentário */}
                        <p className={`text-slate-700 leading-relaxed mb-6 text-[15px] ${!resena.comment ? 'italic opacity-60' : ''}`}>
                          "{resena.comment || "Sin comentario dejado por el prestador."}"
                        </p>
                      </div>

                      {/* Rodapé do Cartão (Info do Prestador e Serviço) */}
                      <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden">
                          {resena.reviewer_avatar ? (
                            <img src={resena.reviewer_avatar} alt={prestador} className="w-full h-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{prestador}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Icon size={12} className={color} />
                            <p className="text-xs text-slate-500 truncate">{resena.service_title}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* ESTADO VAZIO (Empty State Premium) */
          <div className="h-[70vh] flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
            
            <div className="relative mb-8 group">
              {/* Halos Decorativos */}
              <div className="absolute inset-0 bg-orange-100 rounded-full scale-150 blur-2xl opacity-50 group-hover:scale-[1.7] transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-white rounded-full scale-125 shadow-sm"></div>
              
              {/* Ícone Principal */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg text-white transform group-hover:-translate-y-2 transition-transform duration-500">
                <Star size={40} fill="currentColor" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-orange-500">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 text-center tracking-tight">
              Todavía no recibiste reseñas
            </h2>
            <p className="text-slate-500 text-center max-w-md mb-8 text-lg leading-relaxed">
              Las reseñas aparecerán acá cuando un profesional finalice un servicio tuyo y deje un comentario sobre su experiencia.
            </p>

            <button className="px-6 py-3 bg-white border border-slate-200 hover:border-orange-200 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
              <Calendar size={18} />
              Solicitar un nuevo servicio
            </button>
            
          </div>
        )}
      </main>
    </div>
  );
}
