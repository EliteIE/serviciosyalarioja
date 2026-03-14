const TermsAndConditions = () => {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-2">Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground mb-8">Última actualización: 13 de marzo de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
          <p>Al acceder y utilizar la plataforma <strong>Servicios Ya</strong> (en adelante, "la Plataforma"), disponible en serviciosyalr.com, usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo, le solicitamos que no utilice la Plataforma.</p>
          <p>Estos términos se rigen por la legislación argentina vigente, incluyendo la Ley 24.240 de Defensa del Consumidor, el Código Civil y Comercial de la Nación, y las normativas aplicables al comercio electrónico.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
          <p>Servicios Ya es una plataforma digital que conecta a personas que necesitan servicios profesionales del hogar y mantenimiento (en adelante, "Clientes") con prestadores de servicios verificados (en adelante, "Prestadores"). La Plataforma actúa como intermediaria tecnológica y <strong>no es parte de la relación contractual</strong> entre el Cliente y el Prestador.</p>
          <p>Los servicios ofrecidos incluyen, entre otros: plomería, electricidad, limpieza, pintura, albañilería y jardinería, dentro de la provincia de La Rioja, República Argentina.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Registro y Cuentas de Usuario</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Los usuarios deben ser mayores de 18 años para registrarse.</li>
            <li>La información proporcionada durante el registro debe ser veraz, completa y actualizada.</li>
            <li>Cada usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
            <li>Los Prestadores deberán someterse a un proceso de verificación de identidad y documentación profesional antes de poder ofrecer servicios a través de la Plataforma.</li>
            <li>La Plataforma se reserva el derecho de suspender o cancelar cuentas que incumplan estos términos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Funcionamiento de la Plataforma</h2>
          <h3 className="text-lg font-medium mt-4 mb-2">4.1 Solicitud de Servicios</h3>
          <p>El Cliente publica una solicitud describiendo el servicio requerido, incluyendo categoría, dirección, nivel de urgencia y descripción detallada. Los Prestadores verificados de la categoría correspondiente podrán visualizar la solicitud y enviar un presupuesto.</p>
          
          <h3 className="text-lg font-medium mt-4 mb-2">4.2 Presupuestos</h3>
          <p>Los presupuestos enviados por los Prestadores son propuestas económicas no vinculantes hasta su aceptación por parte del Cliente. Una vez aceptado el presupuesto, ambas partes se comprometen a cumplir con los términos acordados.</p>
          
          <h3 className="text-lg font-medium mt-4 mb-2">4.3 Ejecución del Servicio</h3>
          <p>El Prestador debe presentarse en el domicilio indicado y ejecutar el servicio de acuerdo a lo presupuestado. La Plataforma provee un código de verificación para confirmar la presencia del Prestador en el lugar.</p>
          
          <h3 className="text-lg font-medium mt-4 mb-2">4.4 Finalización y Pago</h3>
          <p>Una vez que el Prestador marca el servicio como finalizado, el Cliente debe efectuar el pago a través de los medios habilitados en la Plataforma (MercadoPago, transferencia bancaria o efectivo). El servicio se considera completado una vez confirmado el pago.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Pagos y Comisiones</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>La Plataforma cobra una comisión porcentual sobre cada transacción completada, la cual será informada al momento de la contratación.</li>
            <li>Los pagos realizados a través de MercadoPago están sujetos a los términos y condiciones de dicha plataforma de pagos.</li>
            <li>En el caso de pagos por transferencia bancaria, el Cliente deberá confirmar el envío del comprobante a través de la Plataforma.</li>
            <li>Los pagos en efectivo se registran bajo la declaración del Cliente y no generan respaldo transaccional en la Plataforma.</li>
            <li>Los Prestadores recibirán el monto correspondiente menos la comisión de la Plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Cargos Adicionales</h2>
          <p>Si durante la ejecución del servicio surgen trabajos adicionales no contemplados en el presupuesto original, el Prestador podrá solicitar cargos extra a través de la Plataforma. Estos cargos deberán ser aprobados por el Cliente antes de ser incluidos en el monto total.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Reseñas y Calificaciones</h2>
          <p>Tras la finalización de un servicio, ambas partes podrán calificar y dejar una reseña. Las reseñas deben ser honestas, respetuosas y basadas en la experiencia real del servicio. La Plataforma se reserva el derecho de moderar y eliminar reseñas que contengan contenido ofensivo, difamatorio o fraudulento.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Disputas</h2>
          <p>En caso de desacuerdo entre Cliente y Prestador, cualquiera de las partes podrá abrir una disputa a través de la Plataforma. El equipo de moderación evaluará el caso y emitirá una resolución. Las partes podrán recurrir a los organismos de defensa del consumidor y a la justicia ordinaria según la legislación vigente.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Responsabilidad de la Plataforma</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Servicios Ya actúa exclusivamente como intermediaria tecnológica y no garantiza la calidad, idoneidad o resultado de los servicios prestados.</li>
            <li>La Plataforma no es responsable por daños materiales, personales o de cualquier naturaleza que puedan derivarse de la prestación de servicios.</li>
            <li>La verificación de Prestadores reduce riesgos pero no constituye una garantía absoluta de competencia profesional.</li>
            <li>La Plataforma no será responsable por interrupciones temporales del servicio por mantenimiento o fuerza mayor.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Obligaciones de los Prestadores</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Prestar el servicio conforme a lo presupuestado y con la diligencia profesional esperada.</li>
            <li>Mantener actualizada su documentación profesional y datos de contacto.</li>
            <li>Cumplir con todas las normativas laborales, fiscales e impositivas aplicables a su actividad (incluyendo inscripción ante AFIP como monotributista o responsable inscripto, según corresponda).</li>
            <li>No contactar a los Clientes por fuera de la Plataforma para evadir comisiones.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Obligaciones de los Clientes</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Proporcionar información veraz sobre el servicio requerido y la dirección de ejecución.</li>
            <li>Garantizar el acceso seguro al domicilio donde se realizará el servicio.</li>
            <li>Efectuar el pago por el servicio dentro de los plazos y medios acordados.</li>
            <li>Tratar al Prestador con respeto y dignidad.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Propiedad Intelectual</h2>
          <p>Todo el contenido de la Plataforma (diseño, marcas, logos, código fuente, textos) es propiedad de Servicios Ya y está protegido por las leyes de propiedad intelectual de la República Argentina (Ley 11.723). Queda prohibida su reproducción sin autorización previa por escrito.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Modificaciones</h2>
          <p>Servicios Ya se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán notificadas a los usuarios a través de la Plataforma y/o por correo electrónico. El uso continuado de la Plataforma tras la notificación implica la aceptación de los nuevos términos.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">14. Ley Aplicable y Jurisdicción</h2>
          <p>Estos Términos se rigen por las leyes de la República Argentina. Para cualquier controversia que no pueda resolverse por los mecanismos internos de la Plataforma, serán competentes los tribunales ordinarios de la ciudad de La Rioja, provincia de La Rioja, República Argentina.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">15. Contacto</h2>
          <p>Para consultas sobre estos Términos y Condiciones, puede comunicarse a través de la Plataforma o al correo electrónico: <strong>contacto@serviciosyalr.com</strong></p>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions;
