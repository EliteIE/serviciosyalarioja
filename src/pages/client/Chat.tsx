import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from "react-router-dom";
import { 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Phone, 
  Info,
  Check,
  CheckCheck,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Archive
} from 'lucide-react';
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useClientRequests, useProviderRequests, useUploadFile } from "@/hooks/useServiceRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const serviceId = searchParams.get("service");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Detect if provider or client based on route
  const isProvider = location.pathname.startsWith("/prestador");
  const { data: clientServices } = useClientRequests();
  const { data: providerServices } = useProviderRequests();
  const services = isProvider ? providerServices : clientServices;

  const [selectedService, setSelectedService] = useState<string | null>(serviceId);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const { data: messages, isLoading: isLoadingMessages } = useMessages(selectedService);
  const sendMessage = useSendMessage();
  const uploadFile = useUploadFile();

  // Fetch last message for each conversation to show preview
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!services || services.length === 0) return;
      const validIds = services.filter(s => s.status !== 'cancelado').map(s => s.id);
      if (validIds.length === 0) return;
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from("messages")
        .select("service_request_id, content, message_type, created_at")
        .in("service_request_id", validIds)
        .order("created_at", { ascending: false });
      if (!data) return;
      const map: Record<string, string> = {};
      for (const msg of data) {
        if (!map[msg.service_request_id]) {
          map[msg.service_request_id] = msg.message_type === 'image' ? 'Imagen' : (msg.content || '');
        }
      }
      setLastMessages(map);
    };
    fetchLastMessages();
  }, [services]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Listen to unread messages across all active services 
  const activeServiceIds = useMemo(() => {
    return (services || [])
      .filter(s => s.status !== 'cancelado')
      .map(s => s.id);
  }, [services]);
  const { unreadServiceIds } = useUnreadMessages(activeServiceIds);

  const currentService = services?.find((s) => s.id === selectedService);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (serviceId) setSelectedService(serviceId);
  }, [serviceId]);

  // Sync URL when selecting a chat
  const handleSelectChat = (id: string | null) => {
    setSelectedService(id);
    if (id) {
      setSearchParams({ service: id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMsg.trim() || !selectedService || !user) return;
    
    const content = newMsg.trim();
    setNewMsg(""); // Optimistic clear
    
    await sendMessage.mutateAsync({
      service_request_id: selectedService,
      sender_id: user.id,
      content: content,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedService || !user) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "chat");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      await sendMessage.mutateAsync({
        service_request_id: selectedService,
        sender_id: user.id,
        content: url,
        message_type: isPdf ? "file" : "image",
      });
    } catch (err) {
      toast.error("Error al subir el archivo. Intentá de nuevo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter conversations based on search
  const chatServices = useMemo(() => {
    if (!services) return [];
    const valid = services.filter((s) => s.status !== "cancelado");
    
    if (!searchTerm.trim()) return valid;
    
    return valid.filter(s => {
      const counterpartName = isProvider ? s.client_name : s.provider_name;
      const term = searchTerm.toLowerCase();
      return (
        s.title.toLowerCase().includes(term) || 
        (counterpartName && counterpartName.toLowerCase().includes(term))
      );
    });
  }, [services, searchTerm, isProvider]);

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] bg-slate-50 flex font-sans overflow-hidden rounded-xl border border-border shadow-sm">
      
      {/* PAINEL ESQUERDO: Lista de Conversas
        Escondido em mobile se houver um chat ativo 
      */}
      <div className={`w-full md:w-[380px] lg:w-[420px] bg-card border-r border-border flex flex-col flex-shrink-0 ${selectedService ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header da Lista */}
        <div className="h-20 px-6 border-b border-border flex items-center justify-between flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-slate-500 hover:text-foreground transition-colors">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  setSearchTerm("");
                  const input = document.querySelector<HTMLInputElement>('input[placeholder="Buscar conversaciones..."]');
                  input?.focus();
                }}
              >
                <Search className="mr-2 h-4 w-4" /> Buscar conversación
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["messages"] });
                  queryClient.invalidateQueries({ queryKey: ["service-requests"] });
                  toast.success("Conversaciones actualizadas");
                }}
              >
                <Archive className="mr-2 h-4 w-4" /> Actualizar conversaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        {/* Lista Rolável de Contactos */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {chatServices.length === 0 ? (
            <p className="text-muted-foreground p-8 text-center text-sm">No se encontraron conversaciones.</p>
          ) : (
            chatServices.map((s) => {
              const isActive = selectedService === s.id;
              const counterpartName = isProvider ? s.client_name : s.provider_name;
              const displayName = counterpartName || (isProvider ? "Cliente" : "Sin prestador");
              const initial = displayName.charAt(0).toUpperCase();
              const hasUnread = unreadServiceIds.has(s.id);
              
              const lastMsg = lastMessages[s.id];
              const previewStatus = lastMsg
                ? (lastMsg.length > 40 ? lastMsg.slice(0, 40) + '...' : lastMsg)
                : (s.status === 'completado' ? 'Servicio completado' : 'Chat activo');

              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectChat(s.id)}
                  className={`w-full p-4 flex items-start gap-4 border-b border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${isActive ? 'bg-orange-50 dark:bg-orange-900/10 relative' : ''}`}
                >
                  {/* Indicador de Chat Ativo (Borda esquerda) */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full"></div>
                  )}

                  {/* Avatar com Indicador */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 overflow-hidden">
                      {(() => {
                        const avatar = isProvider ? s.client_avatar : s.provider_avatar;
                        return avatar ? (
                          <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initial
                        );
                      })()}
                    </div>
                    {/* Status indicator: active service (not online presence) */}
                    {s.status !== 'completado' && s.status !== 'cancelado' && (
                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-orange-400 border-2 border-white dark:border-slate-900 rounded-full" title="Servicio activo"></div>
                    )}
                  </div>

                  {/* Info da Conversa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-sm font-bold truncate pr-2 ${hasUnread ? 'text-foreground' : 'text-slate-600 dark:text-slate-400'}`}>
                        {displayName}
                      </h3>
                      <span className={`text-xs font-medium ${hasUnread ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                        {new Date(s.updated_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      <span className="font-medium text-slate-600 bg-muted dark:text-slate-300 px-1.5 py-0.5 rounded truncate mr-1">
                        {s.category.split(' ')[0]}
                      </span>
                      {s.title}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate pr-4 ${hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground w-11/12'}`}>
                        {previewStatus}
                      </p>
                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* PAINEL DIREITO: Janela de Chat Ativa */}
      {currentService ? (
        <div className={`flex-1 flex flex-col bg-background relative ${!selectedService ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header do Chat */}
          <header className="h-20 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between flex-shrink-0 shadow-sm z-10 w-full">
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              {/* Botão Voltar (Apenas Mobile) */}
              <button 
                onClick={() => handleSelectChat(null)}
                className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="relative flex-shrink-0">
                {(() => {
                  const counterpartAvatar = isProvider ? currentService.client_avatar : currentService.provider_avatar;
                  const counterpartName = isProvider ? currentService.client_name : currentService.provider_name;
                  return (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 overflow-hidden">
                      {counterpartAvatar ? (
                        <img src={counterpartAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        counterpartName?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                  );
                })()}
                {currentService.status !== 'completado' && currentService.status !== 'cancelado' && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-orange-400 border-2 border-white dark:border-slate-900 rounded-full" title="Servicio activo"></div>}
              </div>
              
              <div className="min-w-0">
                <h2 className="font-bold text-foreground truncate">
                  {(isProvider ? currentService.client_name : currentService.provider_name) || (isProvider ? "Cliente" : "Esperando prestador")}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground font-medium hidden sm:block">{currentService.status === 'completado' ? 'Finalizado' : currentService.status === 'cancelado' ? 'Cancelado' : 'Servicio activo'}</p>
                  <span className="w-1 h-1 bg-border rounded-full hidden sm:block"></span>
                  <p className="text-xs text-muted-foreground max-w-[150px] sm:max-w-xs md:max-w-md truncate">{currentService.title}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 ml-2">
            </div>
          </header>

          {/* Área de Mensagens (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-background/50">
            {/* Aviso de Segurança Inicial */}
            <div className="flex justify-center mb-6">
              <div className="bg-orange-100/50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg px-4 py-2 text-xs text-orange-800 dark:text-orange-400 text-center max-w-md shadow-sm">
                Mantén tus comunicaciones dentro de la plataforma por tu seguridad. Nunca compartas contraseñas o datos de tarjetas bancarias.
              </div>
            </div>

            {isLoadingMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : messages?.length === 0 ? (
               <div className="flex justify-center text-muted-foreground text-sm">
                 Enviá el primer mensaje para empezar a conversar.
               </div>
            ) : (
              messages?.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const isSystem = msg.message_type === "system";

                // System Messages
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-4">
                      <div className="bg-muted border border-border shadow-sm rounded-xl px-4 py-2 flex flex-col items-center">
                        <span className="text-xs font-semibold text-foreground text-center max-w-xs">{msg.content}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Regular Chat Bubbles
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                    {/* Avatar do remetente (só para mensagens de outros) */}
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 mt-5 overflow-hidden border border-border">
                        {msg.sender_avatar ? (
                          <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          msg.sender_name?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>
                    )}
                    <div className={`max-w-[80%] sm:max-w-[70%] lg:max-w-[55%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                      {!isMe && <span className="text-[11px] text-muted-foreground mb-1 ml-1">{msg.sender_name}</span>}

                      {(msg.message_type === "image" || msg.message_type === "file") && msg.content?.toLowerCase().endsWith(".pdf") ? (
                         <div className={`px-4 py-3 rounded-2xl shadow-sm flex items-center gap-3 ${isMe ? 'bg-orange-600 text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30'}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isMe ? 'text-primary-foreground' : 'text-red-600'}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary-foreground' : 'text-foreground'}`}>Documento PDF</p>
                             <a href={msg.content} target="_blank" rel="noopener noreferrer" className={`text-xs font-medium underline underline-offset-2 ${isMe ? 'text-primary-foreground/80 hover:text-primary-foreground' : 'text-primary hover:text-primary/80'}`}>
                               Descargar / Ver
                             </a>
                           </div>
                         </div>
                      ) : msg.message_type === "image" ? (
                         <div className={`p-1 rounded-2xl shadow-sm ${isMe ? 'bg-orange-600' : 'bg-card border border-border'}`}>
                           <img src={msg.content} alt="Attachment" className="max-w-full sm:max-w-xs rounded-xl self-end" loading="lazy" />
                         </div>
                      ) : (
                        <div className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed relative ${
                          isMe 
                            ? 'bg-orange-600 text-primary-foreground rounded-2xl rounded-br-sm' 
                            : 'bg-card text-foreground border border-border rounded-2xl rounded-bl-sm'
                        }`}>
                          <p className="break-words">{msg.content}</p>
                        </div>
                      )}
                      
                      {/* Hora e Estado da Mensagem */}
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {new Date(msg.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && (
                          <span className="text-slate-400">
                            {/* Assumindo que num DB real teríamos read_at, por agora colocamos checkCheck fake se não tá carregando a lista */}
                            <CheckCheck size={14} className="opacity-70" />
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input de Texto */}
          <div className="p-3 sm:p-4 bg-card border-t border-border">
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept="image/*,.pdf,application/pdf"
              onChange={handleFileUpload}
            />
            
            <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
              
              <div className="flex gap-1 pb-1">
                <button 
                  type="button" 
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-accent rounded-full transition-colors"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin text-orange-500" /> : <Paperclip size={20} />}
                </button>
                <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-accent rounded-full transition-colors hidden sm:block">
                  <ImageIcon size={20} />
                </button>
              </div>

              <div className="flex-1 bg-background border border-border rounded-2xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <textarea 
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full max-h-32 bg-transparent px-4 py-3 outline-none resize-none min-h-[48px] text-foreground"
                  rows={1}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <button 
                type="submit"
                disabled={!newMsg.trim() || sendMessage.isPending}
                className={`p-3.5 rounded-full flex items-center justify-center transition-all ${
                  newMsg.trim() && !sendMessage.isPending
                    ? 'bg-orange-600 text-primary-foreground shadow-sm hover:bg-orange-500 transform hover:-translate-y-0.5' 
                    : 'bg-muted text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={20} className={newMsg.trim() ? "translate-x-0.5" : ""} />
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* Estado Vazio (Nenhum chat selecionado - visível principalmente em Desktop) */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-background">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
            <MessageSquare size={48} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Tus Mensajes</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Seleccioná una conversación del panel lateral para empezar a chatear o resolver dudas sobre tus servicios.
          </p>
        </div>
      )}

    </div>
  );
}
