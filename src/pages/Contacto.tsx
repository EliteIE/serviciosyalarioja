import { useState } from "react";
import { Mail, Send, Loader2, Phone, MapPin, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Contacto = () => {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.email || !formData.asunto || !formData.mensaje) {
      toast.error("Por favor completá todos los campos");
      return;
    }

    setSending(true);
    try {
      // TODO: connect to Supabase table when ready
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Mensaje enviado correctamente. Te responderemos a la brevedad.");
      setFormData({ nombre: "", email: "", asunto: "", mensaje: "" });
    } catch (err) {
      toast.error(err.message || "Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Contacto y Soporte</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          ¿Tenés alguna consulta, problema o sugerencia? Escribinos y te responderemos lo antes posible.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a
                    href="mailto:soporte@servicios360.com.ar"
                    className="text-sm text-primary hover:underline"
                  >
                    soporte@servicios360.com.ar
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">
                    Lunes a Viernes, 9 a 18 hs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Ubicación</h3>
                  <p className="text-sm text-muted-foreground">La Rioja, Argentina</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Respuesta rápida</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Nuestro equipo responde en un plazo de 24 a 48 horas hábiles. Para problemas urgentes, usá el asunto "Problema técnico".
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Envianos tu mensaje
              </CardTitle>
              <CardDescription>
                Completá el formulario y nos pondremos en contacto con vos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, nombre: e.target.value }))
                      }
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto</Label>
                  <Select
                    value={formData.asunto}
                    onValueChange={(value) =>
                      setFormData((f) => ({ ...f, asunto: value }))
                    }
                  >
                    <SelectTrigger id="asunto">
                      <SelectValue placeholder="Seleccioná un asunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta_general">Consulta general</SelectItem>
                      <SelectItem value="problema_tecnico">Problema técnico</SelectItem>
                      <SelectItem value="reclamo">Reclamo</SelectItem>
                      <SelectItem value="sugerencia">Sugerencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, mensaje: e.target.value }))
                    }
                    placeholder="Describí tu consulta con el mayor detalle posible..."
                    rows={5}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl gap-2"
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar Mensaje
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contacto;
