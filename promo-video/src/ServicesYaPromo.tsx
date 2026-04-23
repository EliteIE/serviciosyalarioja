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
import {
  BRAND,
  COLORS,
  PROVIDERS,
  PROVIDER_NOTICES,
  SERVICE_LABELS,
  STEPS,
  TRUST_METRICS,
} from './brand';

type Variant = 'vertical' | 'landscape';

type PromoProps = {
  variant: Variant;
};

type CameraMove = {
  fromX: number;
  toX: number;
  fromY: number;
  toY: number;
  fromScale: number;
  toScale: number;
  fromRotate: number;
  toRotate: number;
  floatX: number;
  floatY: number;
  breathe: number;
  origin?: string;
};

const DURATIONS = {
  intro: 90,
  services: 105,
  search: 120,
  trust: 105,
  providers: 120,
  cta: 120,
} as const;

export const PROMO_FPS = 30;
export const PROMO_DURATION_IN_FRAMES = Object.values(DURATIONS).reduce(
  (total, duration) => total + duration,
  0,
);

const CAMERA_PRESETS: Record<
  'intro' | 'services' | 'search' | 'trust' | 'providers' | 'cta',
  CameraMove
> = {
  intro: {
    fromX: -34,
    toX: 26,
    fromY: 26,
    toY: -22,
    fromScale: 1.06,
    toScale: 1.14,
    fromRotate: -1.6,
    toRotate: 0.9,
    floatX: 8,
    floatY: 5,
    breathe: 0.012,
    origin: '45% 42%',
  },
  services: {
    fromX: 24,
    toX: -30,
    fromY: 14,
    toY: -16,
    fromScale: 1.08,
    toScale: 1.16,
    fromRotate: 1.1,
    toRotate: -0.8,
    floatX: 7,
    floatY: 4,
    breathe: 0.01,
    origin: '56% 46%',
  },
  search: {
    fromX: -16,
    toX: 38,
    fromY: -10,
    toY: 18,
    fromScale: 1.09,
    toScale: 1.18,
    fromRotate: -0.8,
    toRotate: 1.2,
    floatX: 6,
    floatY: 5,
    breathe: 0.014,
    origin: '58% 50%',
  },
  trust: {
    fromX: 30,
    toX: -18,
    fromY: 18,
    toY: -20,
    fromScale: 1.07,
    toScale: 1.15,
    fromRotate: 1.3,
    toRotate: -0.7,
    floatX: 7,
    floatY: 6,
    breathe: 0.011,
    origin: '48% 46%',
  },
  providers: {
    fromX: -28,
    toX: 24,
    fromY: 12,
    toY: -18,
    fromScale: 1.08,
    toScale: 1.17,
    fromRotate: -1.2,
    toRotate: 0.8,
    floatX: 7,
    floatY: 5,
    breathe: 0.013,
    origin: '60% 50%',
  },
  cta: {
    fromX: 0,
    toX: 0,
    fromY: 24,
    toY: -22,
    fromScale: 1.05,
    toScale: 1.16,
    fromRotate: -0.5,
    toRotate: 0.5,
    floatX: 4,
    floatY: 6,
    breathe: 0.015,
    origin: '50% 50%',
  },
};

const FONT_STACK = "'Aptos Display', 'Aptos', 'Segoe UI Variable Text', 'Segoe UI', sans-serif";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const panelStyle = (
  radius: number,
  border: string = COLORS.line,
): React.CSSProperties => ({
  background: `linear-gradient(180deg, rgba(18, 39, 64, 0.84), rgba(10, 24, 42, 0.52))`,
  border: `1px solid ${border}`,
  borderRadius: radius,
  boxShadow:
    '0 40px 120px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(28px)',
});

const useScale = (variant: Variant) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width, height) / 1080;
  const isVertical = variant === 'vertical';

  return {
    width,
    height,
    scale,
    isVertical,
    title: (isVertical ? 92 : 84) * scale,
    display: (isVertical ? 108 : 96) * scale,
    subtitle: (isVertical ? 34 : 28) * scale,
    body: (isVertical ? 26 : 22) * scale,
    small: (isVertical ? 18 : 16) * scale,
    pill: (isVertical ? 20 : 17) * scale,
    sectionGap: (isVertical ? 42 : 28) * scale,
    padding: (isVertical ? 86 : 72) * scale,
    cardRadius: 34 * scale,
  };
};

const SceneShell: React.FC<{
  duration: number;
  variant: Variant;
  camera: CameraMove;
  children: React.ReactNode;
}> = ({duration, variant, camera, children}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);

  const opacity = interpolate(frame, [0, 8, duration - 14, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, 12], [36 * sizing.scale, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cameraTranslateX =
    interpolate(
      frame,
      [0, duration],
      [camera.fromX * sizing.scale, camera.toX * sizing.scale],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    ) + Math.sin(frame / 20) * camera.floatX * sizing.scale;
  const cameraTranslateY =
    interpolate(
      frame,
      [0, duration],
      [camera.fromY * sizing.scale, camera.toY * sizing.scale],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    ) + Math.cos(frame / 24 + 0.4) * camera.floatY * sizing.scale;
  const cameraScale =
    interpolate(frame, [0, duration], [camera.fromScale, camera.toScale], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) + Math.sin(frame / 28 + 0.3) * camera.breathe;
  const cameraRotate =
    interpolate(frame, [0, duration], [camera.fromRotate, camera.toRotate], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) + Math.sin(frame / 46 + 0.1) * 0.18;

  return (
    <AbsoluteFill
      style={{
        padding: sizing.padding,
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: FONT_STACK,
        color: COLORS.white,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: camera.origin ?? '50% 50%',
          transform: `translate3d(${cameraTranslateX}px, ${cameraTranslateY}px, 0) scale(${cameraScale}) rotate(${cameraRotate}deg)`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const FloatLayer: React.FC<{
  variant: Variant;
  delay?: number;
  x?: number;
  y?: number;
  rotate?: number;
  children: React.ReactNode;
}> = ({variant, delay = 0, x = 10, y = 12, rotate = 1.4, children}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const driftX = Math.sin(frame / 18 + delay) * x * sizing.scale;
  const driftY = Math.cos(frame / 24 + delay) * y * sizing.scale;
  const driftRotate = Math.sin(frame / 40 + delay) * rotate;

  return (
    <div
      style={{
        transform: `translate3d(${driftX}px, ${driftY}px, 0) rotate(${driftRotate}deg)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

const CinematicOverlay: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(2, 8, 14, 0.14) 72%, rgba(2, 8, 14, 0.42) 100%)',
      }}
    />
  );
};

const BackgroundArt: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const gridSize = 72 * sizing.scale;
  const rightDrift = Math.sin(frame / 90) * 30 * sizing.scale;
  const leftDrift = Math.cos(frame / 110) * 26 * sizing.scale;
  const pulse = 0.9 + ((Math.sin(frame / 24) + 1) / 2) * 0.1;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 18% 20%, rgba(255, 122, 0, 0.20), transparent 24%),
            radial-gradient(circle at 84% 10%, rgba(56, 147, 255, 0.22), transparent 20%),
            radial-gradient(circle at 76% 84%, rgba(255, 159, 69, 0.16), transparent 18%),
            linear-gradient(135deg, #08131f 0%, ${COLORS.navy} 24%, ${COLORS.navySoft} 58%, #173b61 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.18,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(2, 8, 14, 0.22) 0%, transparent 16%, transparent 84%, rgba(2, 8, 14, 0.4) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 420 * sizing.scale,
          height: 420 * sizing.scale,
          borderRadius: '50%',
          top: 110 * sizing.scale,
          left: -120 * sizing.scale + leftDrift,
          background: 'radial-gradient(circle, rgba(255, 122, 0, 0.24), transparent 68%)',
          filter: 'blur(24px)',
          transform: `scale(${pulse})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 540 * sizing.scale,
          height: 540 * sizing.scale,
          borderRadius: '50%',
          top: -60 * sizing.scale,
          right: -100 * sizing.scale + rightDrift,
          background: 'radial-gradient(circle, rgba(56, 147, 255, 0.22), transparent 70%)',
          filter: 'blur(32px)',
          transform: `scale(${1.02 - (pulse - 0.9)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 380 * sizing.scale,
          height: 380 * sizing.scale,
          borderRadius: '50%',
          bottom: 40 * sizing.scale,
          right: 160 * sizing.scale,
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 72%)',
          filter: 'blur(14px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 420 * sizing.scale,
          height: 420 * sizing.scale,
          borderRadius: '50%',
          border: `1px solid ${COLORS.line}`,
          top: -110 * sizing.scale,
          right: -60 * sizing.scale,
          opacity: 0.2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 560 * sizing.scale,
          height: 560 * sizing.scale,
          borderRadius: '50%',
          border: `1px solid ${COLORS.line}`,
          bottom: -200 * sizing.scale,
          left: -120 * sizing.scale,
          opacity: 0.14,
        }}
      />
      <SignalRibbon variant={variant} tone="blue" position="top-right" />
      <SignalRibbon variant={variant} tone="orange" position="bottom-left" />
    </AbsoluteFill>
  );
};

const BrandTopline: React.FC<{variant: Variant; accent?: string}> = ({
  variant,
  accent = 'Campana publicitaria',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({fps, frame, config: {damping: 14, stiffness: 120}});

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12 * sizing.scale,
        alignSelf: 'flex-start',
        padding: `${10 * sizing.scale}px ${18 * sizing.scale}px`,
        borderRadius: 999,
        background: 'rgba(7, 17, 28, 0.46)',
        border: `1px solid ${COLORS.line}`,
        fontSize: sizing.small,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        transform: `translateX(${interpolate(reveal, [0, 1], [-30 * sizing.scale, 0])}px)`,
        opacity: reveal,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
      }}
    >
      <span
        style={{
          width: 22 * sizing.scale,
          height: 2 * sizing.scale,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${COLORS.orangeSoft}, ${COLORS.orange})`,
          boxShadow: `0 0 20px rgba(255, 122, 0, 0.45)`,
        }}
      />
      <span>{accent}</span>
    </div>
  );
};

const SignalRibbon: React.FC<{
  variant: Variant;
  tone: 'blue' | 'orange';
  position: 'top-right' | 'bottom-left';
}> = ({variant, tone, position}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);
  const isTop = position === 'top-right';
  const barCount = variant === 'vertical' ? 24 : 34;
  const ribbonWidth = (variant === 'vertical' ? 290 : 450) * sizing.scale;
  const ribbonHeight = (variant === 'vertical' ? 130 : 110) * sizing.scale;
  const baseColor =
    tone === 'blue'
      ? 'linear-gradient(180deg, rgba(56, 147, 255, 0.95), rgba(56, 147, 255, 0.16))'
      : 'linear-gradient(180deg, rgba(255, 159, 69, 0.95), rgba(255, 122, 0, 0.16))';

  return (
    <div
      style={{
        position: 'absolute',
        width: ribbonWidth,
        height: ribbonHeight,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6 * sizing.scale,
        opacity: tone === 'blue' ? 0.48 : 0.44,
        right: isTop ? 54 * sizing.scale : undefined,
        top: isTop ? 78 * sizing.scale : undefined,
        left: isTop ? undefined : 54 * sizing.scale,
        bottom: isTop ? undefined : 88 * sizing.scale,
        transform: `rotate(${isTop ? -10 : 8}deg)`,
        filter: 'drop-shadow(0 18px 30px rgba(0, 0, 0, 0.18))',
      }}
    >
      {Array.from({length: barCount}).map((_, index) => {
        const wave = (Math.sin(frame / 8 + index * 0.52) + 1) / 2;
        const barHeight = interpolate(wave, [0, 1], [16, isTop ? 92 : 78], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={`${position}-${tone}-${index}`}
            style={{
              width: (variant === 'vertical' ? 7 : 8) * sizing.scale,
              height: barHeight * sizing.scale,
              borderRadius: 999,
              background: baseColor,
              opacity: 0.28 + (index / barCount) * 0.72,
            }}
          />
        );
      })}
    </div>
  );
};

const ServiceChip: React.FC<{
  label: string;
  index: number;
  variant: Variant;
}> = ({label, index, variant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({
    fps,
    frame: frame - index * 5,
    config: {damping: 14, stiffness: 130},
  });

  return (
    <div
      style={{
        ...panelStyle(999),
        padding: `${12 * sizing.scale}px ${18 * sizing.scale}px`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12 * sizing.scale,
        fontSize: sizing.pill,
        fontWeight: 700,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [22 * sizing.scale, 0])}px) scale(${interpolate(
          reveal,
          [0, 1],
          [0.96, 1],
        )})`,
        background: 'rgba(9, 22, 37, 0.52)',
      }}
    >
      <span
        style={{
          width: 20 * sizing.scale,
          height: 2 * sizing.scale,
          borderRadius: 999,
          background: `linear-gradient(180deg, ${COLORS.orangeSoft}, ${COLORS.orange})`,
          boxShadow: `0 0 18px rgba(255, 122, 0, 0.35)`,
        }}
      />
      <span>{label}</span>
    </div>
  );
};

const ResultCard: React.FC<{
  index: number;
  variant: Variant;
  provider: (typeof PROVIDERS)[number];
}> = ({index, variant, provider}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({
    fps,
    frame: frame - 16 - index * 8,
    config: {damping: 14, stiffness: 135},
  });

  return (
    <div
      style={{
        ...panelStyle(30 * sizing.scale),
        padding: 22 * sizing.scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 12 * sizing.scale,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [34 * sizing.scale, 0])}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14 * sizing.scale}}>
          <div
            style={{
              width: 48 * sizing.scale,
              height: 48 * sizing.scale,
              borderRadius: '50%',
              background: `linear-gradient(180deg, ${COLORS.orange}, ${COLORS.orangeSoft})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18 * sizing.scale,
              color: COLORS.white,
            }}
          >
            {provider.name.charAt(0)}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 3 * sizing.scale}}>
            <span style={{fontSize: 23 * sizing.scale, fontWeight: 800}}>{provider.name}</span>
            <span style={{fontSize: sizing.small, color: COLORS.muted}}>{provider.role}</span>
          </div>
        </div>
        <div
          style={{
            padding: `${8 * sizing.scale}px ${14 * sizing.scale}px`,
            borderRadius: 999,
            background: 'rgba(46, 208, 141, 0.16)',
            color: '#bff5de',
            fontSize: sizing.small,
            fontWeight: 700,
          }}
        >
          {provider.badge}
        </div>
      </div>
      <div style={{display: 'flex', gap: 14 * sizing.scale, flexWrap: 'wrap'}}>
        {['★★★★★', provider.rating, provider.response, provider.price].map((item) => (
          <div
            key={item}
            style={{
              padding: `${8 * sizing.scale}px ${12 * sizing.scale}px`,
              borderRadius: 16 * sizing.scale,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              fontSize: sizing.small,
              color: item === '★★★★★' ? '#ffd166' : COLORS.ink,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  index: number;
  variant: Variant;
  metric: (typeof TRUST_METRICS)[number];
}> = ({index, variant, metric}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({
    fps,
    frame: frame - 10 - index * 6,
    config: {damping: 14, stiffness: 130},
  });

  return (
    <div
      style={{
        ...panelStyle(30 * sizing.scale),
        padding: 26 * sizing.scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 12 * sizing.scale,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [30 * sizing.scale, 0])}px)`,
      }}
    >
      <div style={{fontSize: 46 * sizing.scale, fontWeight: 900, lineHeight: 1}}>{metric.value}</div>
      <div style={{fontSize: 24 * sizing.scale, fontWeight: 800}}>{metric.label}</div>
      <div style={{fontSize: sizing.body, color: COLORS.muted, lineHeight: 1.45}}>{metric.note}</div>
    </div>
  );
};

const StepCard: React.FC<{
  index: number;
  variant: Variant;
  step: (typeof STEPS)[number];
}> = ({index, variant, step}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({
    fps,
    frame: frame - 10 - index * 6,
    config: {damping: 16, stiffness: 140},
  });

  return (
    <div
      style={{
        ...panelStyle(28 * sizing.scale),
        padding: 24 * sizing.scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 12 * sizing.scale,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [28 * sizing.scale, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 56 * sizing.scale,
          height: 56 * sizing.scale,
          borderRadius: 18 * sizing.scale,
          background: `linear-gradient(180deg, ${COLORS.orange}, ${COLORS.orangeSoft})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20 * sizing.scale,
          fontWeight: 900,
          letterSpacing: '0.06em',
        }}
      >
        {step.step}
      </div>
      <div style={{fontSize: 24 * sizing.scale, fontWeight: 800}}>{step.title}</div>
      <div style={{fontSize: sizing.body, color: COLORS.muted, lineHeight: 1.45}}>
        {step.description}
      </div>
    </div>
  );
};

const CTAButton: React.FC<{
  variant: Variant;
  label: string;
  emphasis?: 'primary' | 'secondary';
}> = ({variant, label, emphasis = 'primary'}) => {
  const sizing = useScale(variant);

  return (
    <div
      style={{
        padding: `${18 * sizing.scale}px ${28 * sizing.scale}px`,
        borderRadius: 999,
        background:
          emphasis === 'primary'
            ? `linear-gradient(180deg, ${COLORS.orangeSoft}, ${COLORS.orange})`
            : 'rgba(9, 22, 37, 0.52)',
        border:
          emphasis === 'primary'
            ? '1px solid rgba(255, 255, 255, 0.18)'
            : `1px solid ${COLORS.line}`,
        color: COLORS.white,
        fontWeight: 800,
        fontSize: sizing.body,
        boxShadow:
          emphasis === 'primary'
            ? '0 22px 44px rgba(255, 122, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
            : '0 14px 36px rgba(0, 0, 0, 0.18)',
      }}
    >
      {label}
    </div>
  );
};

const IntroScene: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({fps, frame, config: {damping: 13, stiffness: 120}});
  const logo = staticFile('logo.png');

  return (
    <SceneShell duration={DURATIONS.intro} variant={variant} camera={CAMERA_PRESETS.intro}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: variant === 'vertical' ? 0 : 26 * sizing.scale,
            top: variant === 'vertical' ? 220 * sizing.scale : 170 * sizing.scale,
            width: variant === 'vertical' ? 220 * sizing.scale : 300 * sizing.scale,
            height: variant === 'vertical' ? 220 * sizing.scale : 300 * sizing.scale,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 147, 255, 0.24), transparent 68%)',
            filter: 'blur(14px)',
            opacity: 0.55,
          }}
        />
        <div style={{display: 'flex', flexDirection: 'column', gap: sizing.sectionGap}}>
          <BrandTopline variant={variant} accent="Disponible en La Rioja" />
          <div
            style={{
              display: 'flex',
              flexDirection: variant === 'vertical' ? 'column' : 'row',
              gap: 32 * sizing.scale,
              alignItems: variant === 'vertical' ? 'flex-start' : 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24 * sizing.scale,
              }}
            >
              <FloatLayer variant={variant} delay={0.4} x={8} y={10} rotate={1.1}>
                <div
                  style={{
                    ...panelStyle(34 * sizing.scale, 'rgba(255,255,255,0.18)'),
                    width: 128 * sizing.scale,
                    height: 128 * sizing.scale,
                    padding: 18 * sizing.scale,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${interpolate(reveal, [0, 1], [0.8, 1])}) rotate(${interpolate(
                      reveal,
                      [0, 1],
                      [-8, 0],
                    )}deg)`,
                  }}
                >
                  <Img src={logo} style={{width: '100%', height: '100%', borderRadius: 22 * sizing.scale}} />
                </div>
              </FloatLayer>
              {variant === 'landscape' ? (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <div style={{fontSize: 30 * sizing.scale, color: COLORS.orangeSoft, fontWeight: 800}}>
                    Campana 2026
                  </div>
                  <div style={{fontSize: 64 * sizing.scale, fontWeight: 900}}>{BRAND.name}</div>
                </div>
              ) : null}
            </div>
            {variant === 'landscape' ? (
              <div
                style={{
                  ...panelStyle(999),
                  padding: `${16 * sizing.scale}px ${24 * sizing.scale}px`,
                  fontSize: sizing.body,
                  fontWeight: 700,
                }}
              >
                {BRAND.city} + hogar + confianza
              </div>
            ) : null}
          </div>
          {variant === 'vertical' ? (
            <div style={{fontSize: 30 * sizing.scale, color: COLORS.orangeSoft, fontWeight: 800}}>
              Campana 2026
            </div>
          ) : null}
          <div
            style={{
              fontSize: sizing.display,
              fontWeight: 900,
              lineHeight: 0.94,
              letterSpacing: '-0.05em',
              maxWidth: variant === 'vertical' ? '100%' : '72%',
            }}
          >
            {BRAND.tagline}
          </div>
          <div
            style={{
              fontSize: sizing.subtitle,
              maxWidth: variant === 'vertical' ? '100%' : '62%',
              color: COLORS.muted,
              lineHeight: 1.35,
            }}
          >
            {BRAND.subtagline}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14 * sizing.scale,
            maxWidth: variant === 'vertical' ? '100%' : '72%',
          }}
        >
          {SERVICE_LABELS.slice(0, 4).map((label, index) => (
            <ServiceChip key={label} label={label} index={index} variant={variant} />
          ))}
        </div>
      </div>
    </SceneShell>
  );
};

const ServicesScene: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);

  return (
    <SceneShell duration={DURATIONS.services} variant={variant} camera={CAMERA_PRESETS.services}>
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: variant === 'vertical' ? '1fr' : '1.05fr 0.95fr',
          gap: 28 * sizing.scale,
          alignItems: 'center',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: sizing.sectionGap}}>
          <BrandTopline variant={variant} accent="Todo en un solo lugar" />
          <div
            style={{
              fontSize: sizing.title,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
            }}
          >
            De la urgencia al profesional correcto, en minutos.
          </div>
          <div
            style={{
              fontSize: sizing.subtitle,
              color: COLORS.muted,
              lineHeight: 1.4,
              maxWidth: variant === 'vertical' ? '100%' : '92%',
            }}
          >
            Plomeria, electricidad, limpieza, pintura y mas. Un marketplace pensado para resolver
            rapido lo que tu hogar necesita.
          </div>
        </div>
        <FloatLayer variant={variant} delay={1.1} x={14} y={9} rotate={0.8}>
          <div
            style={{
              ...panelStyle(sizing.cardRadius),
              padding: 28 * sizing.scale,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 18 * sizing.scale,
            }}
          >
            {SERVICE_LABELS.map((label, index) => (
              <ServiceChip key={label} label={label} index={index} variant={variant} />
            ))}
          </div>
        </FloatLayer>
      </div>
    </SceneShell>
  );
};

const SearchScene: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const sizing = useScale(variant);

  // Typewriter-style reveal keeps the search interaction readable even without narration.
  const typedLength = clamp(Math.floor(frame / 2.2), 1, BRAND.searchPrompt.length);
  const searchText = BRAND.searchPrompt.slice(0, typedLength);
  const showCursor = Math.floor(frame / 10) % 2 === 0;

  return (
    <SceneShell duration={DURATIONS.search} variant={variant} camera={CAMERA_PRESETS.search}>
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: variant === 'vertical' ? '1fr' : '0.92fr 1.08fr',
          gap: 32 * sizing.scale,
          alignItems: 'center',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: sizing.sectionGap}}>
          <BrandTopline variant={variant} accent="Busca, compara, contrata" />
          <div
            style={{
              fontSize: sizing.title,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
            }}
          >
            Encontrar ayuda confiable puede sentirse instantaneo.
          </div>
          <div style={{fontSize: sizing.subtitle, color: COLORS.muted, lineHeight: 1.4}}>
            Buscas por problema o categoria, comparas perfiles verificados y pides presupuesto sin
            compromiso.
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: variant === 'vertical' ? '1fr' : 'repeat(3, minmax(0, 1fr))',
              gap: 14 * sizing.scale,
            }}
          >
            {STEPS.map((step, index) => (
              <StepCard key={step.step} index={index} variant={variant} step={step} />
            ))}
          </div>
        </div>
        <FloatLayer variant={variant} delay={1.7} x={12} y={11} rotate={1.2}>
          <div
            style={{
              ...panelStyle(sizing.cardRadius, 'rgba(255,255,255,0.18)'),
              padding: 24 * sizing.scale,
              display: 'flex',
              flexDirection: 'column',
              gap: 18 * sizing.scale,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12 * sizing.scale,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  flex: 1,
                  ...panelStyle(22 * sizing.scale),
                  padding: `${18 * sizing.scale}px ${20 * sizing.scale}px`,
                  fontSize: sizing.body,
                  fontWeight: 700,
                }}
              >
                {searchText}
                <span style={{opacity: showCursor ? 1 : 0, marginLeft: 4 * sizing.scale}}>|</span>
              </div>
              <div
                style={{
                  padding: `${18 * sizing.scale}px ${20 * sizing.scale}px`,
                  borderRadius: 22 * sizing.scale,
                  background: `linear-gradient(180deg, ${COLORS.orangeSoft}, ${COLORS.orange})`,
                  fontSize: sizing.body,
                  fontWeight: 800,
                }}
              >
                Buscar
              </div>
            </div>
            <div
              style={{
                ...panelStyle(22 * sizing.scale),
                padding: `${16 * sizing.scale}px ${20 * sizing.scale}px`,
                fontSize: sizing.small,
                color: COLORS.ink,
                display: 'inline-flex',
                alignSelf: 'flex-start',
              }}
            >
              Zona: {BRAND.searchLocation}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 14 * sizing.scale}}>
              {PROVIDERS.map((provider, index) => (
                <ResultCard key={provider.name} index={index} variant={variant} provider={provider} />
              ))}
            </div>
          </div>
        </FloatLayer>
      </div>
    </SceneShell>
  );
};

const TrustScene: React.FC<{variant: Variant}> = ({variant}) => {
  const sizing = useScale(variant);

  return (
    <SceneShell duration={DURATIONS.trust} variant={variant} camera={CAMERA_PRESETS.trust}>
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: variant === 'vertical' ? '1fr' : '0.88fr 1.12fr',
          gap: 28 * sizing.scale,
          alignItems: 'center',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: sizing.sectionGap}}>
          <BrandTopline variant={variant} accent="Confianza que se siente" />
          <div
            style={{
              fontSize: sizing.title,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
            }}
          >
            Elegi con datos claros, no con suerte.
          </div>
          <div style={{fontSize: sizing.subtitle, color: COLORS.muted, lineHeight: 1.4}}>
            Reseñas reales, perfiles revisados y tiempos de respuesta visibles para decidir con
            seguridad.
          </div>
          <div
            style={{
              ...panelStyle(sizing.cardRadius),
              padding: 26 * sizing.scale,
              display: 'flex',
              flexDirection: 'column',
              gap: 18 * sizing.scale,
            }}
          >
            <div style={{fontSize: 24 * sizing.scale, fontWeight: 800}}>Lo que mira el cliente</div>
            <div style={{display: 'flex', gap: 12 * sizing.scale, flexWrap: 'wrap'}}>
              {['Resenas reales', 'Perfiles verificados', 'Precios transparentes', 'Disponibles hoy'].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      padding: `${12 * sizing.scale}px ${16 * sizing.scale}px`,
                      borderRadius: 999,
                      background: 'rgba(255, 255, 255, 0.06)',
                      fontSize: sizing.small,
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
        <FloatLayer variant={variant} delay={2.2} x={10} y={8} rotate={0.9}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: variant === 'vertical' ? '1fr' : 'repeat(3, minmax(0, 1fr))',
              gap: 18 * sizing.scale,
            }}
          >
            {TRUST_METRICS.map((metric, index) => (
              <MetricCard key={metric.label} index={index} variant={variant} metric={metric} />
            ))}
          </div>
        </FloatLayer>
      </div>
    </SceneShell>
  );
};

const ProviderScene: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const dashboardReveal = spring({
    fps,
    frame: frame - 12,
    config: {damping: 15, stiffness: 140},
  });

  return (
    <SceneShell duration={DURATIONS.providers} variant={variant} camera={CAMERA_PRESETS.providers}>
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: variant === 'vertical' ? '1fr' : '0.94fr 1.06fr',
          gap: 28 * sizing.scale,
          alignItems: 'center',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: sizing.sectionGap}}>
          <BrandTopline variant={variant} accent="Tambien impulsa prestadores" />
          <div
            style={{
              fontSize: sizing.title,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
            }}
          >
            Sos profesional? Multiplica tus ingresos.
          </div>
          <div style={{fontSize: sizing.subtitle, color: COLORS.muted, lineHeight: 1.4}}>
            {BRAND.providerLine} Unite a una plataforma que convierte visibilidad en proyectos.
          </div>
          <div style={{display: 'flex', gap: 14 * sizing.scale, flexWrap: 'wrap'}}>
            <CTAButton variant={variant} label="Registrate gratis" />
            <CTAButton variant={variant} label="Conoce como funciona" emphasis="secondary" />
          </div>
        </div>
        <FloatLayer variant={variant} delay={2.8} x={12} y={12} rotate={1.5}>
          <div
            style={{
              ...panelStyle(sizing.cardRadius, 'rgba(255,255,255,0.18)'),
              padding: 28 * sizing.scale,
              display: 'flex',
              flexDirection: 'column',
              gap: 18 * sizing.scale,
              transform: `translateY(${interpolate(dashboardReveal, [0, 1], [34 * sizing.scale, 0])}px) rotate(${interpolate(
                dashboardReveal,
                [0, 1],
                [4, 0],
              )}deg)`,
              opacity: dashboardReveal,
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: 6 * sizing.scale}}>
                <span style={{fontSize: 28 * sizing.scale, fontWeight: 800}}>Tu perfil destacado</span>
                <span style={{fontSize: sizing.small, color: COLORS.muted}}>5.0 promedio | Nuevos pedidos cada semana</span>
              </div>
              <div
                style={{
                  width: 66 * sizing.scale,
                  height: 66 * sizing.scale,
                  borderRadius: 22 * sizing.scale,
                  background: `linear-gradient(180deg, ${COLORS.orange}, ${COLORS.orangeSoft})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24 * sizing.scale,
                  fontWeight: 900,
                }}
              >
                360
              </div>
            </div>
            {PROVIDER_NOTICES.map((notice, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={notice.title}
                  style={{
                    ...panelStyle(26 * sizing.scale, isPrimary ? 'rgba(46, 208, 141, 0.35)' : COLORS.line),
                    padding: 20 * sizing.scale,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10 * sizing.scale,
                    opacity: isPrimary ? 1 : 0.82,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      padding: `${8 * sizing.scale}px ${12 * sizing.scale}px`,
                      borderRadius: 999,
                      background: isPrimary ? 'rgba(46, 208, 141, 0.18)' : 'rgba(255, 122, 0, 0.18)',
                      color: isPrimary ? '#bff5de' : '#ffd6ab',
                      fontSize: sizing.small,
                      fontWeight: 700,
                    }}
                  >
                    {notice.label}
                  </div>
                  <div style={{fontSize: 24 * sizing.scale, fontWeight: 800}}>{notice.title}</div>
                  <div style={{fontSize: sizing.body, color: COLORS.muted}}>{notice.meta}</div>
                </div>
              );
            })}
          </div>
        </FloatLayer>
      </div>
    </SceneShell>
  );
};

const CTAScene: React.FC<{variant: Variant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sizing = useScale(variant);
  const reveal = spring({fps, frame, config: {damping: 12, stiffness: 120}});
  const logo = staticFile('logo.png');

  return (
    <SceneShell duration={DURATIONS.cta} variant={variant} camera={CAMERA_PRESETS.cta}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 24 * sizing.scale,
          transform: `scale(${interpolate(reveal, [0, 1], [0.95, 1])})`,
          opacity: reveal,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '22% 12% auto 12%',
            height: variant === 'vertical' ? 220 * sizing.scale : 160 * sizing.scale,
            background:
              'radial-gradient(circle at center, rgba(56, 147, 255, 0.16), transparent 62%)',
            filter: 'blur(22px)',
          }}
        />
        <FloatLayer variant={variant} delay={3.1} x={8} y={12} rotate={1.1}>
          <div
            style={{
              ...panelStyle(38 * sizing.scale, 'rgba(255,255,255,0.18)'),
              width: 150 * sizing.scale,
              height: 150 * sizing.scale,
              padding: 20 * sizing.scale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Img src={logo} style={{width: '100%', height: '100%', borderRadius: 24 * sizing.scale}} />
          </div>
        </FloatLayer>
        <div style={{fontSize: 34 * sizing.scale, color: COLORS.orangeSoft, fontWeight: 800}}>
          Resolvelo hoy
        </div>
        <div
          style={{
            fontSize: variant === 'vertical' ? 96 * sizing.scale : 84 * sizing.scale,
            fontWeight: 900,
            lineHeight: 0.96,
            letterSpacing: '-0.05em',
            maxWidth: variant === 'vertical' ? '100%' : '76%',
          }}
        >
          Servicios 360 conecta hogares con profesionales de confianza.
        </div>
        <div
          style={{
            ...panelStyle(999, 'rgba(255,255,255,0.16)'),
            padding: `${18 * sizing.scale}px ${28 * sizing.scale}px`,
            fontSize: 34 * sizing.scale,
            fontWeight: 800,
          }}
        >
          {BRAND.domain}
        </div>
        <div style={{display: 'flex', gap: 14 * sizing.scale, flexWrap: 'wrap', justifyContent: 'center'}}>
          <CTAButton variant={variant} label="Pedi tu presupuesto gratis" />
          <CTAButton variant={variant} label="Registrate como profesional" emphasis="secondary" />
        </div>
      </div>
    </SceneShell>
  );
};

export const ServicesYaPromo: React.FC<PromoProps> = ({variant}) => {
  let cursor = 0;

  const introFrom = cursor;
  cursor += DURATIONS.intro;
  const servicesFrom = cursor;
  cursor += DURATIONS.services;
  const searchFrom = cursor;
  cursor += DURATIONS.search;
  const trustFrom = cursor;
  cursor += DURATIONS.trust;
  const providersFrom = cursor;
  cursor += DURATIONS.providers;
  const ctaFrom = cursor;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.navy,
        color: COLORS.white,
      }}
    >
      <BackgroundArt variant={variant} />
      <CinematicOverlay />

      <Sequence from={introFrom} durationInFrames={DURATIONS.intro}>
        <IntroScene variant={variant} />
      </Sequence>

      <Sequence from={servicesFrom} durationInFrames={DURATIONS.services}>
        <ServicesScene variant={variant} />
      </Sequence>

      <Sequence from={searchFrom} durationInFrames={DURATIONS.search}>
        <SearchScene variant={variant} />
      </Sequence>

      <Sequence from={trustFrom} durationInFrames={DURATIONS.trust}>
        <TrustScene variant={variant} />
      </Sequence>

      <Sequence from={providersFrom} durationInFrames={DURATIONS.providers}>
        <ProviderScene variant={variant} />
      </Sequence>

      <Sequence from={ctaFrom} durationInFrames={DURATIONS.cta}>
        <CTAScene variant={variant} />
      </Sequence>
    </AbsoluteFill>
  );
};
