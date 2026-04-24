import Seo from "@/components/Seo";

const PrivacyPolicy = () => {
  return (
    <div className="container max-w-4xl py-12">
      <Seo
        title="Política de Privacidad"
        description="Cómo Servicios 360 recopila, usa y protege tus datos personales, en cumplimiento de la Ley 25.326 de Protección de Datos Personales de la República Argentina."
        canonicalPath="/privacidad"
      />
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-muted-foreground mb-8">Última actualización: 13 de marzo de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introducción</h2>
          <p><strong>Servicios 360</strong> (en adelante, "la Plataforma") se compromete a proteger la privacidad de sus usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos sus datos personales, en cumplimiento con la Ley 25.326 de Protección de Datos Personales de la República Argentina y su decreto reglamentario 1558/2001.</p>
          <p>Al utilizar la Plataforma, usted consiente el tratamiento de sus datos conforme a esta política.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Responsable del Tratamiento</h2>
          <p>El responsable del tratamiento de los datos personales es Servicios 360, con domicilio en la provincia de La Rioja, República Argentina. Contacto: <strong>contacto@servicios360.com.ar</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Datos que Recopilamos</h2>
          <h3 className="text-lg font-medium mt-4 mb-2">3.1 Datos proporcionados por el usuario</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Datos de registro:</strong> nombre completo, dirección de correo electrónico, número de teléfono.</li>
            <li><strong>Datos de perfil:</strong> foto de perfil, ubicación, biografía profesional (para Prestadores).</li>
            <li><strong>Datos profesionales (Prestadores):</strong> categoría de servicio, documentación de verificación, área de cobertura, rango de precios.</li>
            <li><strong>Datos bancarios (Prestadores):</strong> alias bancario y CVU para recibir pagos por transferencia.</li>
            <li><strong>Datos de solicitudes:</strong> dirección del servicio, descripción del trabajo requerido, fotografías del estado actual.</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">3.2 Datos generados por el uso</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Historial de servicios solicitados y/o prestados.</li>
            <li>Mensajes intercambiados entre Clientes y Prestadores.</li>
            <li>Calificaciones y reseñas.</li>
            <li>Datos de transacciones y pagos.</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">3.3 Datos recopilados automáticamente</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Dirección IP, tipo de navegador y dispositivo.</li>
            <li>Datos de uso y navegación dentro de la Plataforma.</li>
            <li>Cookies técnicas necesarias para el funcionamiento de la Plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Finalidad del Tratamiento</h2>
          <p>Sus datos personales serán utilizados para los siguientes fines:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Gestionar su cuenta de usuario y autenticación.</li>
            <li>Facilitar la conexión entre Clientes y Prestadores.</li>
            <li>Procesar solicitudes de servicios, presupuestos y pagos.</li>
            <li>Verificar la identidad y documentación de los Prestadores.</li>
            <li>Enviar notificaciones relacionadas con sus servicios activos.</li>
            <li>Gestionar disputas y reclamos.</li>
            <li>Mejorar la calidad y funcionalidad de la Plataforma.</li>
            <li>Cumplir con obligaciones legales y fiscales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Base Legal del Tratamiento</h2>
          <p>El tratamiento de datos se realiza con base en:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Consentimiento:</strong> otorgado al momento del registro y aceptación de estos términos.</li>
            <li><strong>Ejecución contractual:</strong> necesario para la prestación del servicio de intermediación.</li>
            <li><strong>Obligación legal:</strong> cumplimiento de normativas fiscales y de defensa del consumidor.</li>
            <li><strong>Interés legítimo:</strong> prevención de fraudes y mejora de la Plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Compartición de Datos</h2>
          <p>Sus datos personales podrán ser compartidos con:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Otros usuarios:</strong> información de perfil público necesaria para la prestación del servicio (nombre, foto, calificaciones). Los datos bancarios del Prestador se muestran únicamente al Cliente que selecciona "transferencia" como medio de pago.</li>
            <li><strong>Procesadores de pago:</strong> MercadoPago S.R.L. para el procesamiento de pagos electrónicos, bajo sus propios términos y condiciones.</li>
            <li><strong>Proveedores de infraestructura:</strong> servicios de hosting y base de datos (Supabase) para el almacenamiento seguro de información.</li>
            <li><strong>Autoridades competentes:</strong> cuando sea requerido por orden judicial o disposición legal.</li>
          </ul>
          <p><strong>No vendemos ni compartimos sus datos personales con terceros con fines publicitarios o de marketing.</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Almacenamiento y Seguridad</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Los datos se almacenan en servidores seguros con cifrado en tránsito (TLS/SSL) y en reposo.</li>
            <li>El acceso a los datos está restringido mediante políticas de seguridad a nivel de filas (Row Level Security) que garantizan que cada usuario solo acceda a sus propios datos.</li>
            <li>Las contraseñas se almacenan de forma encriptada y nunca son visibles para el equipo de la Plataforma.</li>
            <li>Los documentos de verificación de Prestadores se almacenan en repositorios privados con acceso restringido.</li>
            <li>Los datos se conservarán mientras la cuenta del usuario esté activa y por el período adicional que requiera la legislación vigente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Derechos del Titular de los Datos</h2>
          <p>Conforme a la Ley 25.326, usted tiene derecho a:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Acceso:</strong> solicitar información sobre los datos personales que tenemos almacenados sobre usted (Art. 14).</li>
            <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos (Art. 16).</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad para la que fueron recopilados (Art. 16).</li>
            <li><strong>Confidencialidad:</strong> exigir que sus datos sean tratados con la debida reserva (Art. 10).</li>
          </ul>
          <p>Para ejercer estos derechos, contacte a <strong>contacto@servicios360.com.ar</strong>. Responderemos dentro de los 10 días hábiles establecidos por la ley.</p>
          <p>La Dirección Nacional de Protección de Datos Personales (AAIP), órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes. Sitio web: <strong>www.argentina.gob.ar/aaip</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
          <p>La Plataforma utiliza cookies técnicas estrictamente necesarias para su funcionamiento (autenticación de sesión, preferencias de usuario). No utilizamos cookies de rastreo publicitario ni de terceros con fines de perfilamiento.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Menores de Edad</h2>
          <p>La Plataforma no está dirigida a menores de 18 años. No recopilamos intencionalmente datos de menores de edad. Si tomamos conocimiento de que hemos recopilado datos de un menor, procederemos a su eliminación inmediata.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Transferencia Internacional de Datos</h2>
          <p>Los datos podrán ser almacenados en servidores ubicados fuera de la República Argentina (infraestructura de Supabase). En tales casos, se garantiza un nivel de protección adecuado conforme a la legislación argentina vigente y las disposiciones de la AAIP.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Modificaciones</h2>
          <p>Esta Política de Privacidad podrá ser actualizada periódicamente. Notificaremos los cambios relevantes a través de la Plataforma. La fecha de última actualización se indica al inicio de este documento.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Contacto</h2>
          <p>Para consultas, reclamos o ejercicio de derechos relacionados con sus datos personales:</p>
          <p>Correo electrónico: <strong>contacto@servicios360.com.ar</strong></p>
          <p>Plataforma: <strong>servicios360.com.ar</strong></p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
