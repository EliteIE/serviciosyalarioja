import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {BRAND, SERVICE_LABELS} from './brand';

type Variant = 'vertical' | 'landscape';

type PromoProps = {
  variant: Variant;
};

type CameraPreset = {
  fromX: number;
  toX: number;
  fromY: number;
  toY: number;
  fromScale: number;
  toScale: number;
  fromRotate: number;
  toRotate: number;
};

const COLORS = {
  paper: '#f4f3f0',
  paperSoft: '#eceae6',
  ink: '#0f1217',
  inkSoft: '#6e747f',
  blue: '#245bff',
  blueSoft: '#8fb2ff',
  orange: '#ff7a00',
  orangeSoft: '#ffb06b',
  line: 'rgba(15, 18, 23, 0.12)',
  card: 'rgba(255, 255, 255, 0.78)',
  cardBorder: 'rgba(15, 18, 23, 0.08)',
};

const DURATIONS = {
  intro: 90,
  map: 110,
  search: 100,
  orb: 130,
  provider: 110,
  cta: 120,
} as const;

export const PROMO_FPS = 30;
export const PROMO_DURATION_IN_FRAMES = Object.values(DURATIONS).reduce(
  (sum, duration) => sum + duration,
  0,
);

const CAMERA: Record<keyof typeof DURATIONS, CameraPreset> = {
  intro: {
    fromX: -18,
    toX: 14,
    fromY: 20,
    toY: -12,
    fromScale: 1.02,
    toScale: 1.09,
    fromRotate: -0.7,
    toRotate: 0.4,
  },
  map: {
    fromX: 16,
    toX: -12,
    fromY: 10,
    toY: -18,
    fromScale: 1.03,
    toScale: 1.12,
    fromRotate: 0.6,
    toRotate: -0.45,
  },
  search: {
    fromX: -12,
    toX: 18,
    fromY: -8,
    toY: 14,
    fromScale: 1.03,
    toScale: 1.11,
    fromRotate: -0.4,
    toRotate: 0.6,
  },
  orb: {
    fromX: 12,
    toX: -8,
    fromY: 18,
    toY: -10,
    fromScale: 1.04,
    toScale: 1.13,
    fromRotate: 0.45,
    toRotate: -0.3,
  },
  provider: {
    fromX: -16,
    toX: 12,
    fromY: 12,
    toY: -16,
    fromScale: 1.03,
    toScale: 1.1,
    fromRotate: -0.6,
    toRotate: 0.35,
  },
  cta: {
    fromX: 0,
    toX: 0,
    fromY: 22,
    toY: -18,
    fromScale: 1.02,
    toScale: 1.1,
    fromRotate: -0.25,
    toRotate: 0.25,
  },
};

const FONT_STACK = "'Aptos Display', 'Aptos', 'Segoe UI Variable Text', 'Segoe UI', sans-serif";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const useScale = (variant: Variant) => {
  const {width, height} = useVideoConfig();
  const base = Math.min(width, height) / 1080;
  const isVertical = variant === 'vertical';

  return {
    base,
    isVertical,
    width,
    height,
    padding: (isVertical ? 74 : 66) * base,
    body: (isVertical ? 24 : 20) * base,
    small: (isVertical ? 16 : 14) * base,
    title: (isVertical ? 96 : 84) * base,
    subtitle: (isVertical ? 30 : 24) * base,
    label: (isVertical ? 18 : 15) * base,
    cardRadius: 22 * base,
  };
};

const cardStyle = (radius: number): React.CSSProperties => ({
  background: COLORS.card,
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: radius,
  boxShadow: '0 20px 60px rgba(25, 31, 38, 0.08)',
  backdropFilter: 'blur(14px)',
});

const SoftBackground: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const driftA = Math.sin(frame / 40) * 18 * sizing.base;
  const driftB = Math.cos(frame / 46) * 24 * sizing.base;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paperSoft} 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at ${18 + driftA / 20}% 32%, rgba(255, 122, 0, 0.18), transparent 24%),
            radial-gradient(circle at ${76 + driftB / 20}% 28%, rgba(36, 91, 255, 0.18), transparent 24%),
            radial-gradient(circle at 62% 78%, rgba(36, 91, 255, 0.08), transparent 22%),
            radial-gradient(circle at 28% 70%, rgba(255, 176, 107, 0.1), transparent 18%)
          `,
          filter: 'blur(22px)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 56%, rgba(15,18,23,0.04) 88%, rgba(15,18,23,0.1) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const SceneShell: React.FC<{
  variant: Variant;
  duration: number;
  camera: CameraPreset;
  children: React.ReactNode;
}> = ({variant, duration, camera, children}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const opacity = interpolate(frame, [0, 10, duration - 12, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x =
    interpolate(frame, [0, duration], [camera.fromX, camera.toX], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) *
      sizing.base +
    Math.sin(frame / 32) * 4 * sizing.base;
  const y =
    interpolate(frame, [0, duration], [camera.fromY, camera.toY], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) *
      sizing.base +
    Math.cos(frame / 38) * 5 * sizing.base;
  const scale =
    interpolate(frame, [0, duration], [camera.fromScale, camera.toScale], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) +
    Math.sin(frame / 45) * 0.008;
  const rotate =
    interpolate(frame, [0, duration], [camera.fromRotate, camera.toRotate], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) +
    Math.sin(frame / 60) * 0.08;

  return (
    <AbsoluteFill
      style={{
        padding: sizing.padding,
        fontFamily: FONT_STACK,
        color: COLORS.ink,
        opacity,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
          transformOrigin: '50% 50%',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Float: React.FC<{
  variant: Variant;
  delay?: number;
  distance?: number;
  children: React.ReactNode;
}> = ({variant, delay = 0, distance = 10, children}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const x = Math.sin(frame / 22 + delay) * distance * sizing.base;
  const y = Math.cos(frame / 28 + delay) * distance * 0.75 * sizing.base;
  const rotate = Math.sin(frame / 50 + delay) * 0.7;

  return (
    <div
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

const Wordmark: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * sizing.base}}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10 * sizing.base,
          fontSize: sizing.label,
          color: COLORS.inkSoft,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            width: 34 * sizing.base,
            height: 2 * sizing.base,
            background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.blue})`,
            borderRadius: 999,
          }}
        />
        Servicios 360
      </div>
      <div
        style={{
          fontSize: sizing.title,
          fontWeight: 900,
          lineHeight: 0.96,
          letterSpacing: '-0.05em',
          textAlign: 'center',
        }}
      >
        Profesionales verificados
        <br />
        para tu hogar
      </div>
    </div>
  );
};

const MicroCard: React.FC<{
  variant: Variant;
  title: string;
  subtitle: string;
  width?: number;
}> = ({variant, title, subtitle, width}) => {
  const sizing = useScale(variant);

  return (
    <div
      style={{
        ...cardStyle(18 * sizing.base),
        width: width ? width * sizing.base : 210 * sizing.base,
        padding: 14 * sizing.base,
        display: 'flex',
        flexDirection: 'column',
        gap: 6 * sizing.base,
      }}
    >
      <div style={{fontSize: 13 * sizing.base, color: COLORS.inkSoft, letterSpacing: '0.04em'}}>
        {title}
      </div>
      <div style={{fontSize: 15 * sizing.base, fontWeight: 700, lineHeight: 1.25}}>{subtitle}</div>
    </div>
  );
};

const FlowMapScene: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);
  const nodes = variant === 'vertical'
    ? [
        {left: 430, top: 250, title: 'Entrada', subtitle: 'Pedido del cliente', width: 220},
        {left: 220, top: 430, title: 'Categoria', subtitle: 'Electricidad / Plomeria'},
        {left: 640, top: 430, title: 'Zona', subtitle: 'Centro, La Rioja'},
        {left: 430, top: 620, title: 'Match', subtitle: 'Perfiles verificados', width: 220},
        {left: 210, top: 820, title: 'Resenas', subtitle: 'Comparacion clara'},
        {left: 640, top: 820, title: 'Presupuesto', subtitle: 'Respuesta rapida'},
      ]
    : [
        {left: 720, top: 120, title: 'Entrada', subtitle: 'Pedido del cliente', width: 230},
        {left: 420, top: 260, title: 'Categoria', subtitle: 'Electricidad / Plomeria', width: 240},
        {left: 1020, top: 260, title: 'Zona', subtitle: 'Centro, La Rioja', width: 220},
        {left: 720, top: 420, title: 'Match', subtitle: 'Perfiles verificados', width: 240},
        {left: 390, top: 590, title: 'Resenas', subtitle: 'Comparacion clara', width: 220},
        {left: 1030, top: 590, title: 'Presupuesto', subtitle: 'Respuesta rapida', width: 220},
      ];

  const lines = variant === 'vertical'
    ? [
        ['540 360', '335 430'],
        ['540 360', '755 430'],
        ['335 540', '540 620'],
        ['755 540', '540 620'],
        ['540 730', '325 820'],
        ['540 730', '755 820'],
      ]
    : [
        ['835 230', '540 260'],
        ['835 230', '1130 260'],
        ['540 380', '835 420'],
        ['1130 380', '835 420'],
        ['835 540', '500 590'],
        ['835 540', '1140 590'],
      ];

  return (
    <SceneShell variant={variant} duration={DURATIONS.map} camera={CAMERA.map}>
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        <div
          style={{
            position: 'absolute',
            top: variant === 'vertical' ? '17%' : '14%',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: sizing.subtitle,
            color: COLORS.inkSoft,
          }}
        >
          Un flujo claro. Menos ruido. Mejor decision.
        </div>
        <svg
          viewBox={variant === 'vertical' ? '0 0 1080 1920' : '0 0 1920 1080'}
          style={{position: 'absolute', inset: 0, overflow: 'visible'}}
        >
          {lines.map(([from, to], index) => (
            <line
              key={`${from}-${to}-${index}`}
              x1={Number(from.split(' ')[0])}
              y1={Number(from.split(' ')[1])}
              x2={Number(to.split(' ')[0])}
              y2={Number(to.split(' ')[1])}
              stroke={index % 2 === 0 ? 'rgba(36,91,255,0.25)' : 'rgba(255,122,0,0.24)'}
              strokeWidth={2}
            />
          ))}
        </svg>
        {nodes.map((node, index) => (
          <div
            key={`${node.title}-${index}`}
            style={{
              position: 'absolute',
              left: node.left * sizing.base,
              top: node.top * sizing.base,
            }}
          >
            <Float variant={variant} delay={index * 0.45} distance={7}>
              <MicroCard
                variant={variant}
                title={node.title}
                subtitle={node.subtitle}
                width={node.width}
              />
            </Float>
          </div>
        ))}
      </div>
    </SceneShell>
  );
};

const SearchScene: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const query = BRAND.searchPrompt;
  const typedLength = clamp(Math.floor(frame / 2.2), 1, query.length);
  const visibleQuery = query.slice(0, typedLength);

  return (
    <SceneShell variant={variant} duration={DURATIONS.search} camera={CAMERA.search}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28 * sizing.base,
        }}
      >
        <div style={{fontSize: sizing.subtitle, color: COLORS.inkSoft, textAlign: 'center'}}>
          Lo importante aparece en el centro.
        </div>
        <Float variant={variant} delay={0.6} distance={8}>
          <div
            style={{
              ...cardStyle(26 * sizing.base),
              width: (variant === 'vertical' ? 760 : 900) * sizing.base,
              padding: 18 * sizing.base,
              display: 'flex',
              flexDirection: 'column',
              gap: 14 * sizing.base,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12 * sizing.base,
              }}
            >
              <div
                style={{
                  flex: 1,
                  ...cardStyle(18 * sizing.base),
                  padding: `${18 * sizing.base}px ${20 * sizing.base}px`,
                  background: 'rgba(255,255,255,0.62)',
                  fontSize: sizing.body,
                  fontWeight: 600,
                }}
              >
                {visibleQuery}
                <span style={{opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0}}>|</span>
              </div>
              <div
                style={{
                  padding: `${18 * sizing.base}px ${24 * sizing.base}px`,
                  borderRadius: 18 * sizing.base,
                  background: `linear-gradient(180deg, ${COLORS.blue}, #3f63ff)`,
                  color: 'white',
                  fontSize: sizing.body,
                  fontWeight: 800,
                  boxShadow: '0 18px 30px rgba(36, 91, 255, 0.22)',
                }}
              >
                Buscar
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10 * sizing.base,
                flexWrap: 'wrap',
              }}
            >
              {[BRAND.searchLocation, 'Resenas reales', 'Disponible hoy', 'Verificado'].map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  style={{
                    ...cardStyle(999),
                    padding: `${10 * sizing.base}px ${14 * sizing.base}px`,
                    fontSize: sizing.small,
                    color: COLORS.inkSoft,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Float>
      </div>
    </SceneShell>
  );
};

const OrbScene: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const rotation = frame * 0.25;
  const orbitRadius = (variant === 'vertical' ? 390 : 310) * sizing.base;
  const centerX = variant === 'vertical' ? 540 : 960;
  const centerY = variant === 'vertical' ? 900 : 540;

  return (
    <SceneShell variant={variant} duration={DURATIONS.orb} camera={CAMERA.orb}>
      <div style={{position: 'relative', width: '100%', height: '100%'}}>
        <div
          style={{
            position: 'absolute',
            top: variant === 'vertical' ? 180 * sizing.base : 110 * sizing.base,
            left: 0,
            right: 0,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 12 * sizing.base,
            alignItems: 'center',
          }}
        >
          <div style={{fontSize: sizing.label, color: COLORS.inkSoft, letterSpacing: '0.12em', textTransform: 'uppercase'}}>
            Todo gira alrededor de la confianza
          </div>
          <div style={{fontSize: sizing.subtitle, fontWeight: 700}}>Servicios 360, pensado como un sistema simple.</div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: centerX * sizing.base - 230 * sizing.base,
            top: centerY * sizing.base - 230 * sizing.base,
            width: 460 * sizing.base,
            height: 460 * sizing.base,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, rgba(143, 178, 255, 0.95), rgba(36, 91, 255, 0.35) 42%, rgba(255, 122, 0, 0.68) 78%, rgba(255, 122, 0, 0.12) 100%)',
            filter: 'blur(4px)',
            boxShadow: '0 0 120px rgba(36, 91, 255, 0.18), 0 0 80px rgba(255, 122, 0, 0.14)',
          }}
        />

        {Array.from({length: 4}).map((_, index) => (
          <div
            key={`ring-${index}`}
            style={{
              position: 'absolute',
              left: centerX * sizing.base - (240 + index * 40) * sizing.base,
              top: centerY * sizing.base - (240 + index * 40) * sizing.base,
              width: (480 + index * 80) * sizing.base,
              height: (480 + index * 80) * sizing.base,
              borderRadius: '50%',
              border: `1px solid rgba(15, 18, 23, ${0.11 - index * 0.015})`,
              transform: `rotate(${rotation * (index % 2 === 0 ? 1 : -1)}deg)`,
            }}
          />
        ))}

        {SERVICE_LABELS.slice(0, 6).map((label, index) => {
          const angle = ((index / 6) * Math.PI * 2) - Math.PI / 2 + frame / 120;
          const x = centerX * sizing.base + Math.cos(angle) * orbitRadius;
          const y = centerY * sizing.base + Math.sin(angle) * orbitRadius;

          return (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: x - 80 * sizing.base,
                top: y - 16 * sizing.base,
                width: 160 * sizing.base,
                textAlign: 'center',
                fontSize: sizing.small,
                color: COLORS.inkSoft,
              }}
            >
              {label}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: centerX * sizing.base - 170 * sizing.base,
            top: centerY * sizing.base - 60 * sizing.base,
            width: 340 * sizing.base,
            textAlign: 'center',
            fontSize: variant === 'vertical' ? 58 * sizing.base : 54 * sizing.base,
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.02,
            textShadow: '0 8px 28px rgba(0,0,0,0.08)',
          }}
        >
          Servicios
          <br />
          360
        </div>
      </div>
    </SceneShell>
  );
};

const ProviderFlowScene: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);
  const columns = variant === 'vertical'
    ? [
        {x: 220, y: 520, title: 'Cliente', subtitle: 'Describe lo que necesita'},
        {x: 430, y: 760, title: 'Filtro', subtitle: 'Zona, categoria y confianza'},
        {x: 640, y: 520, title: 'Prestador', subtitle: 'Recibe pedidos relevantes'},
      ]
    : [
        {x: 430, y: 420, title: 'Cliente', subtitle: 'Describe lo que necesita'},
        {x: 820, y: 530, title: 'Filtro', subtitle: 'Zona, categoria y confianza'},
        {x: 1210, y: 420, title: 'Prestador', subtitle: 'Recibe pedidos relevantes'},
      ];

  return (
    <SceneShell variant={variant} duration={DURATIONS.provider} camera={CAMERA.provider}>
      <div style={{position: 'relative', width: '100%', height: '100%'}}>
        <div
          style={{
            position: 'absolute',
            top: variant === 'vertical' ? 220 * sizing.base : 110 * sizing.base,
            left: 0,
            right: 0,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 12 * sizing.base,
          }}
        >
          <div style={{fontSize: sizing.label, color: COLORS.inkSoft, letterSpacing: '0.12em', textTransform: 'uppercase'}}>
            Menos friccion para ambos lados
          </div>
          <div style={{fontSize: sizing.subtitle, fontWeight: 700}}>El sistema conecta demanda real con profesionales listos.</div>
        </div>

        <svg
          viewBox={variant === 'vertical' ? '0 0 1080 1920' : '0 0 1920 1080'}
          style={{position: 'absolute', inset: 0}}
        >
          {variant === 'vertical' ? (
            <>
              <line x1="330" y1="640" x2="540" y2="760" stroke="rgba(36,91,255,0.24)" strokeWidth="2" />
              <line x1="750" y1="640" x2="540" y2="760" stroke="rgba(255,122,0,0.24)" strokeWidth="2" />
            </>
          ) : (
            <>
              <line x1="560" y1="530" x2="820" y2="530" stroke="rgba(36,91,255,0.24)" strokeWidth="2" />
              <line x1="1080" y1="530" x2="1340" y2="530" stroke="rgba(255,122,0,0.24)" strokeWidth="2" />
            </>
          )}
        </svg>

        {columns.map((node, index) => (
          <div
            key={`${node.title}-${index}`}
            style={{position: 'absolute', left: node.x * sizing.base, top: node.y * sizing.base}}
          >
            <Float variant={variant} delay={index * 0.7} distance={8}>
              <MicroCard variant={variant} title={node.title} subtitle={node.subtitle} width={240} />
            </Float>
          </div>
        ))}
      </div>
    </SceneShell>
  );
};

const CTAButton: React.FC<{variant: Variant; label: string; secondary?: boolean}> = ({
  variant,
  label,
  secondary = false,
}) => {
  const sizing = useScale(variant);

  return (
    <div
      style={{
        padding: `${18 * sizing.base}px ${26 * sizing.base}px`,
        borderRadius: 22 * sizing.base,
        background: secondary
          ? 'rgba(255,255,255,0.62)'
          : `linear-gradient(180deg, ${COLORS.blue}, #3f63ff)`,
        color: secondary ? COLORS.ink : 'white',
        fontSize: sizing.body,
        fontWeight: 800,
        border: secondary ? `1px solid ${COLORS.cardBorder}` : 'none',
        boxShadow: secondary ? 'none' : '0 18px 30px rgba(36, 91, 255, 0.22)',
      }}
    >
      {label}
    </div>
  );
};

const CTAScene: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);
  const logo = staticFile('logo.png');

  return (
    <SceneShell variant={variant} duration={DURATIONS.cta} camera={CAMERA.cta}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22 * sizing.base,
          textAlign: 'center',
        }}
      >
        <Float variant={variant} delay={0.5} distance={7}>
          <div
            style={{
              ...cardStyle(28 * sizing.base),
              width: 112 * sizing.base,
              height: 112 * sizing.base,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14 * sizing.base,
            }}
          >
            <Img src={logo} style={{width: '100%', height: '100%', borderRadius: 18 * sizing.base}} />
          </div>
        </Float>
        <Wordmark variant={variant} />
        <div style={{fontSize: sizing.body, color: COLORS.inkSoft, maxWidth: 720 * sizing.base}}>
          Busca. Compara. Contrata. Todo con una presentacion mas limpia y una decision mas rapida.
        </div>
        <div
          style={{
            ...cardStyle(999),
            padding: `${14 * sizing.base}px ${22 * sizing.base}px`,
            fontSize: sizing.subtitle,
            fontWeight: 700,
          }}
        >
          {BRAND.domain}
        </div>
        <div style={{display: 'flex', gap: 12 * sizing.base, flexWrap: 'wrap', justifyContent: 'center'}}>
          <CTAButton variant={variant} label="Pedi tu presupuesto gratis" />
          <CTAButton variant={variant} label="Explorar profesionales" secondary />
        </div>
      </div>
    </SceneShell>
  );
};

const IntroScene: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);

  return (
    <SceneShell variant={variant} duration={DURATIONS.intro} camera={CAMERA.intro}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20 * sizing.base,
          }}
        >
          <Wordmark variant={variant} />
          <div style={{fontSize: sizing.body, color: COLORS.inkSoft}}>
            Una experiencia visual clara, ligera y confiable.
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

export const Servicios360ReferencePromo: React.FC<PromoProps> = ({variant}) => {
  let cursor = 0;
  const intro = cursor;
  cursor += DURATIONS.intro;
  const map = cursor;
  cursor += DURATIONS.map;
  const search = cursor;
  cursor += DURATIONS.search;
  const orb = cursor;
  cursor += DURATIONS.orb;
  const provider = cursor;
  cursor += DURATIONS.provider;
  const cta = cursor;

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.paper}}>
      <SoftBackground variant={variant} />

      <Sequence from={intro} durationInFrames={DURATIONS.intro}>
        <IntroScene variant={variant} />
      </Sequence>

      <Sequence from={map} durationInFrames={DURATIONS.map}>
        <FlowMapScene variant={variant} />
      </Sequence>

      <Sequence from={search} durationInFrames={DURATIONS.search}>
        <SearchScene variant={variant} />
      </Sequence>

      <Sequence from={orb} durationInFrames={DURATIONS.orb}>
        <OrbScene variant={variant} />
      </Sequence>

      <Sequence from={provider} durationInFrames={DURATIONS.provider}>
        <ProviderFlowScene variant={variant} />
      </Sequence>

      <Sequence from={cta} durationInFrames={DURATIONS.cta}>
        <CTAScene variant={variant} />
      </Sequence>
    </AbsoluteFill>
  );
};
