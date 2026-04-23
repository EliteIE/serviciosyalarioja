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
  FLOW_STEPS,
  SERVICES,
  TRUST_BADGES,
  VALUE_PILLS,
  WHATSAPP_MESSAGES,
  WHATSAPP_TAGS,
  type IconName,
} from './premiumPromoData';

const FPS = 30;

const DURATIONS = {
  intro: 90,
  value: 120,
  catalog: 150,
  flow: 180,
  whatsapp: 150,
  trust: 120,
  cta: 180,
} as const;

export const PREMIUM_PROMO_FPS = FPS;
export const PREMIUM_PROMO_DURATION_IN_FRAMES = Object.values(DURATIONS).reduce(
  (sum, duration) => sum + duration,
  0,
);

const FONT_STACK =
  "'Inter', 'Aptos', 'Segoe UI Variable Display', 'Segoe UI', 'Helvetica Neue', sans-serif";

const COLORS = {
  paper: '#fbfcfe',
  pearl: '#f2f5fa',
  mist: '#e8eef7',
  ink: '#111827',
  inkSoft: '#617086',
  inkMute: '#8a98ab',
  blueDeep: '#163c79',
  blue: '#2c66e5',
  blueSoft: '#8bb5ff',
  cyan: '#dbeaff',
  green: '#25d366',
  greenSoft: '#dff8ea',
  coral: '#ffb39a',
  line: 'rgba(17, 24, 39, 0.08)',
  card: 'rgba(255, 255, 255, 0.76)',
  cardStrong: 'rgba(255, 255, 255, 0.9)',
  glow: 'rgba(44, 102, 229, 0.18)',
  shadow: 'rgba(28, 48, 84, 0.12)',
} as const;

const panelStyle = (radius: number, strong: boolean = false): React.CSSProperties => ({
  background: strong
    ? `linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.84))`
    : `linear-gradient(180deg, ${COLORS.cardStrong}, ${COLORS.card})`,
  border: `1px solid ${COLORS.line}`,
  borderRadius: radius,
  boxShadow:
    '0 30px 80px rgba(28, 48, 84, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.72), inset 0 -1px 0 rgba(232, 238, 247, 0.58)',
  backdropFilter: 'blur(32px)',
});

const enterProgress = (frame: number, fps: number, delay = 0, damping = 18, stiffness = 120) =>
  spring({
    fps,
    frame: frame - delay,
    config: {
      damping,
      stiffness,
      mass: 0.85,
    },
  });

const revealStyle = (
  progress: number,
  distance = 28,
  scaleFrom = 0.965,
  blurFrom = 14,
): React.CSSProperties => ({
  opacity: progress,
  transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px) scale(${interpolate(
    progress,
    [0, 1],
    [scaleFrom, 1],
  )})`,
  filter: `blur(${interpolate(progress, [0, 1], [blurFrom, 0])}px)`,
});

const IconGlyph: React.FC<{
  name: IconName;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}> = ({name, size = 24, stroke = COLORS.ink, strokeWidth = 1.8}) => {
  const baseProps = {
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'plumbing':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M8 5v4a3 3 0 0 0 3 3h4" />
          <path {...baseProps} d="M15 12v4a3 3 0 0 1-3 3H6" />
          <path {...baseProps} d="M6 5h4" />
          <path {...baseProps} d="M15 5v3" />
          <path {...baseProps} d="M6 19h3" />
        </svg>
      );
    case 'electric':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M13 2L5 13h5l-1 9 8-11h-5l1-9z" />
        </svg>
      );
    case 'air':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M4 8h12c2.2 0 4 1.8 4 4s-1.8 4-4 4" />
          <path {...baseProps} d="M6 12h9" />
          <path {...baseProps} d="M9 16c0 1.7-1.3 3-3 3" />
          <path {...baseProps} d="M12 18c0 1.7-1.3 3-3 3" />
        </svg>
      );
    case 'carpentry':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M6 7l5 5" />
          <path {...baseProps} d="M14 4l6 6" />
          <path {...baseProps} d="M11 12l-7 7" />
          <path {...baseProps} d="M12 5l3-3 7 7-3 3" />
        </svg>
      );
    case 'cleaning':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M12 3l1.8 3.7L18 8.5l-3.2 2.4 1 4-3.8-2.1-3.8 2.1 1-4L6 8.5l4.2-1.8L12 3z" />
          <path {...baseProps} d="M18.5 16l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5z" />
        </svg>
      );
    case 'garden':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M12 20v-7" />
          <path {...baseProps} d="M12 13c0-4.5 3-8 8-9-1 5-4.5 8-8 9z" />
          <path {...baseProps} d="M12 13c0-4.5-3-8-8-9 1 5 4.5 8 8 9z" />
        </svg>
      );
    case 'search':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle {...baseProps} cx="10.5" cy="10.5" r="5.5" />
          <path {...baseProps} d="M15 15l4.5 4.5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect {...baseProps} x="4" y="6" width="16" height="14" rx="3" />
          <path {...baseProps} d="M8 4v4" />
          <path {...baseProps} d="M16 4v4" />
          <path {...baseProps} d="M4 10h16" />
        </svg>
      );
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M4 11.5L12 5l8 6.5" />
          <path {...baseProps} d="M6 10.5V20h12v-9.5" />
          <path {...baseProps} d="M10 20v-5h4v5" />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M12 3l2.7 5.4 6 1-4.3 4.1 1 5.8L12 16.5 6.6 19.3l1-5.8L3.3 9.4l6-1L12 3z" />
        </svg>
      );
    case 'shield':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M12 3l7 3v5c0 5-2.8 8.5-7 10-4.2-1.5-7-5-7-10V6l7-3z" />
          <path {...baseProps} d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'receipt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M7 4h10v16l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V4z" />
          <path {...baseProps} d="M9 9h6" />
          <path {...baseProps} d="M9 13h6" />
        </svg>
      );
    case 'clock':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle {...baseProps} cx="12" cy="12" r="8" />
          <path {...baseProps} d="M12 8v5l3 2" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M12 20a8 8 0 1 0-4.4-1.3L5 21l2.5-2.3A8 8 0 0 0 12 20z" />
          <path
            {...baseProps}
            d="M9.3 8.8c.2-.3.5-.4.8-.3l1 .6c.3.2.4.5.3.8l-.3.9c.7 1.2 1.7 2.1 2.9 2.8l.8-.3c.3-.1.7 0 .9.2l.7 1c.2.3.2.6-.1.9-.6.6-1.4.8-2.1.5-2.7-1.1-4.8-3.1-5.9-5.8-.3-.7-.1-1.6.5-2.3z"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path {...baseProps} d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path {...baseProps} d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z" />
        </svg>
      );
    default:
      return null;
  }
};

const AmbientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const driftA = Math.sin(frame / 80) * 6;
  const driftB = Math.cos(frame / 90) * 7;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.pearl} 60%, #eef3f9 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at ${18 + driftA}% 12%, rgba(139, 181, 255, 0.20), transparent 24%),
            radial-gradient(circle at ${82 + driftB}% 18%, rgba(255, 179, 154, 0.16), transparent 22%),
            radial-gradient(circle at 64% 78%, rgba(139, 181, 255, 0.12), transparent 22%),
            radial-gradient(circle at 22% 82%, rgba(255, 179, 154, 0.08), transparent 18%)
          `,
          filter: 'blur(18px)',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.32,
          backgroundImage: `
            linear-gradient(rgba(17, 24, 39, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(17, 24, 39, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '84px 84px',
          maskImage: 'radial-gradient(circle at center, black 45%, transparent 95%)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0) 52%, rgba(17, 24, 39, 0.05) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const PremiumBlob: React.FC<{
  left: number;
  top: number;
  size: number;
  seed?: number;
  opacity?: number;
  blur?: number;
}> = ({left, top, size, seed = 0, opacity = 1, blur = 0}) => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 34 + seed) * 18;
  const driftY = Math.cos(frame / 42 + seed) * 16;
  const rotate = Math.sin(frame / 80 + seed) * 7;
  const breathe = 1 + Math.sin(frame / 26 + seed) * 0.035;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        opacity,
        transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(${breathe}) rotate(${rotate}deg)`,
        transformOrigin: '50% 50%',
        filter: `blur(${blur}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '41% 59% 58% 42% / 44% 40% 60% 56%',
          background:
            'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.96) 0%, rgba(219,234,255,0.92) 18%, rgba(111,162,255,0.68) 46%, rgba(255,179,154,0.54) 78%, rgba(255,255,255,0.16) 100%)',
          boxShadow:
            '0 48px 90px rgba(64, 114, 207, 0.18), inset 0 2px 20px rgba(255,255,255,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '8%',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.58)',
          opacity: 0.78,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '19%',
          top: '12%',
          width: '42%',
          height: '22%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.46)',
          filter: 'blur(12px)',
        }}
      />
    </div>
  );
};

const OrbRings: React.FC<{left: number; top: number; size: number; opacity?: number}> = ({
  left,
  top,
  size,
  opacity = 0.2,
}) => {
  const frame = useCurrentFrame();

  return (
    <>
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          style={{
            position: 'absolute',
            left: left - ring * 34,
            top: top - ring * 34,
            width: size + ring * 68,
            height: size + ring * 68,
            borderRadius: '50%',
            border: `1px solid rgba(75, 108, 166, ${opacity - ring * 0.05})`,
            transform: `rotate(${Math.sin(frame / 90 + ring) * (ring % 2 === 0 ? 8 : -6)}deg)`,
          }}
        />
      ))}
    </>
  );
};

const Floating: React.FC<{
  delay?: number;
  x?: number;
  y?: number;
  rotate?: number;
  children: React.ReactNode;
}> = ({delay = 0, x = 10, y = 12, rotate = 1.4, children}) => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 22 + delay) * x;
  const driftY = Math.cos(frame / 28 + delay) * y;
  const driftRotate = Math.sin(frame / 48 + delay) * rotate;

  return (
    <div
      style={{
        transform: `translate3d(${driftX}px, ${driftY}px, 0) rotate(${driftRotate}deg)`,
        transformOrigin: '50% 50%',
      }}
    >
      {children}
    </div>
  );
};

const SceneShell: React.FC<{
  duration: number;
  children: React.ReactNode;
}> = ({duration, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = enterProgress(frame, fps, 0, 18, 120);
  const exit = interpolate(frame, [duration - 18, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);
  const offsetY = interpolate(enter, [0, 1], [26, 0]);
  const cameraX = Math.sin(frame / 42) * 7;
  const cameraY = Math.cos(frame / 48) * 9;

  return (
    <AbsoluteFill
      style={{
        padding: '92px 76px 86px 76px',
        fontFamily: FONT_STACK,
        color: COLORS.ink,
        opacity,
        transform: `translateY(${offsetY}px)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const AccentKicker: React.FC<{label: string}> = ({label}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 4, 16, 140);

  return (
    <div
      style={{
        ...revealStyle(reveal, 18, 0.98, 8),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.68)',
        border: `1px solid ${COLORS.line}`,
        boxShadow: '0 18px 40px rgba(28, 48, 84, 0.07)',
        fontSize: 15,
        fontWeight: 700,
        color: COLORS.inkSoft,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 28,
          height: 2,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.coral})`,
        }}
      />
      {label}
    </div>
  );
};

const BrandLockup: React.FC<{subline?: string; centered?: boolean}> = ({
  subline = BRAND.tagline,
  centered = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 10, 16, 118);
  const logo = staticFile('logo.png');

  return (
    <div
      style={{
        ...revealStyle(reveal, 24, 0.97, 10),
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        textAlign: centered ? 'center' : 'left',
        gap: 18,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <div
          style={{
            ...panelStyle(26, true),
            width: 88,
            height: 88,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Img src={logo} style={{width: '100%', height: '100%', borderRadius: 18}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.inkMute,
              fontWeight: 700,
            }}
          >
            Plataforma multiservicios
          </div>
          <div
            style={{
              fontSize: 76,
              lineHeight: 0.94,
              letterSpacing: '-0.06em',
              fontWeight: 800,
            }}
          >
            {BRAND.name}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 30,
          lineHeight: 1.25,
          color: COLORS.inkSoft,
          maxWidth: 620,
          fontWeight: 500,
        }}
      >
        {subline}
      </div>
    </div>
  );
};

const ServiceMiniToken: React.FC<{
  label: string;
  icon: IconName;
  delay: number;
}> = ({label, icon, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, delay, 17, 135);

  return (
    <div
      style={{
        ...revealStyle(reveal, 22, 0.97, 10),
        ...panelStyle(24),
        padding: '16px 18px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: 'linear-gradient(180deg, rgba(219,234,255,0.82), rgba(255,255,255,0.6))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconGlyph name={icon} stroke={COLORS.blueDeep} />
      </div>
      <div style={{fontSize: 18, fontWeight: 700, color: COLORS.inkSoft}}>{label}</div>
    </div>
  );
};

const ServiceCard: React.FC<{
  index: number;
  label: string;
  subtitle: string;
  icon: IconName;
}> = ({index, label, subtitle, icon}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 14 + index * 6, 18, 132);

  return (
    <div
      style={{
        ...revealStyle(reveal, 26, 0.965, 12),
        ...panelStyle(34),
        padding: 26,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: 220,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: 'linear-gradient(180deg, rgba(219,234,255,0.88), rgba(255,255,255,0.76))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <IconGlyph name={icon} size={26} stroke={COLORS.blueDeep} />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <div style={{fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em'}}>{label}</div>
        <div style={{fontSize: 18, lineHeight: 1.45, color: COLORS.inkSoft}}>{subtitle}</div>
      </div>
    </div>
  );
};

const FlowNode: React.FC<{
  index: number;
  left: number;
  top: number;
  step: string;
  title: string;
  detail: string;
  icon: IconName;
}> = ({index, left, top, step, title, detail, icon}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 12 + index * 10, 17, 135);
  const active = frame >= 34 + index * 24;

  return (
    <div style={{position: 'absolute', left, top}}>
      <div
        style={{
          ...revealStyle(reveal, 24, 0.968, 11),
          ...panelStyle(30, active),
          width: 360,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: active
            ? '0 34px 90px rgba(44, 102, 229, 0.16), inset 0 1px 0 rgba(255,255,255,0.7)'
            : undefined,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: active
                ? 'linear-gradient(180deg, rgba(44,102,229,0.18), rgba(255,255,255,0.68))'
                : 'linear-gradient(180deg, rgba(219,234,255,0.88), rgba(255,255,255,0.7))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconGlyph
              name={icon}
              size={25}
              stroke={active ? COLORS.blue : COLORS.blueDeep}
            />
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              background: active ? 'rgba(44,102,229,0.12)' : 'rgba(17, 24, 39, 0.04)',
              color: active ? COLORS.blueDeep : COLORS.inkMute,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            {step}
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em'}}>{title}</div>
          <div style={{fontSize: 18, lineHeight: 1.42, color: COLORS.inkSoft}}>{detail}</div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  index: number;
  side: 'left' | 'right';
  author: string;
  text: string;
}> = ({index, side, author, text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 18 + index * 16, 18, 130);
  const isRight = side === 'right';

  return (
    <div
      style={{
        ...revealStyle(reveal, 20, 0.975, 10),
        alignSelf: isRight ? 'flex-end' : 'flex-start',
        maxWidth: 540,
        ...panelStyle(26, isRight),
        padding: '18px 20px',
        borderColor: isRight ? 'rgba(37, 211, 102, 0.22)' : COLORS.line,
        background: isRight
          ? 'linear-gradient(180deg, rgba(223,248,234,0.94), rgba(255,255,255,0.9))'
          : `linear-gradient(180deg, ${COLORS.cardStrong}, ${COLORS.card})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isRight ? '#218a4d' : COLORS.inkMute,
        }}
      >
        {author}
      </div>
      <div style={{fontSize: 25, lineHeight: 1.35, color: COLORS.ink}}>{text}</div>
    </div>
  );
};

const TrustBadgeCard: React.FC<{
  index: number;
  left: number;
  top: number;
  title: string;
  subtitle: string;
  icon: IconName;
}> = ({index, left, top, title, subtitle, icon}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 12 + index * 8, 17, 132);

  return (
    <div style={{position: 'absolute', left, top}}>
      <Floating delay={index * 0.4} x={6} y={8} rotate={0.8}>
        <div
          style={{
            ...revealStyle(reveal, 22, 0.97, 10),
            ...panelStyle(26),
            width: 320,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: 'linear-gradient(180deg, rgba(219,234,255,0.86), rgba(255,255,255,0.72))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconGlyph name={icon} size={24} stroke={COLORS.blueDeep} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em'}}>{title}</div>
            <div style={{fontSize: 17, lineHeight: 1.4, color: COLORS.inkSoft}}>{subtitle}</div>
          </div>
        </div>
      </Floating>
    </div>
  );
};

const ActionButton: React.FC<{
  label: string;
  variant?: 'primary' | 'secondary';
}> = ({label, variant = 'primary'}) => {
  const frame = useCurrentFrame();
  const glow = 0.92 + (Math.sin(frame / 16) + 1) * 0.04;
  const isPrimary = variant === 'primary';

  return (
    <div
      style={{
        position: 'relative',
        padding: '22px 28px',
        borderRadius: 26,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: isPrimary ? '#ffffff' : COLORS.ink,
        background: isPrimary
          ? `linear-gradient(180deg, ${COLORS.blue}, #2156cb)`
          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.84))',
        border: isPrimary ? 'none' : `1px solid ${COLORS.line}`,
        boxShadow: isPrimary
          ? `0 26px 60px rgba(44, 102, 229, 0.24), inset 0 1px 0 rgba(255,255,255,0.24), 0 0 0 ${glow}px rgba(44, 102, 229, 0.08)`
          : '0 18px 40px rgba(28, 48, 84, 0.08)',
      }}
    >
      {isPrimary ? (
        <div
          style={{
            position: 'absolute',
            inset: 2,
            borderRadius: 24,
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.26), transparent 34%, transparent 60%, rgba(255,255,255,0.12))',
            opacity: 0.72,
          }}
        />
      ) : null}
      <div style={{position: 'relative', zIndex: 1}}>{label}</div>
    </div>
  );
};

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 12, 16, 118);

  return (
    <SceneShell duration={DURATIONS.intro}>
      <PremiumBlob left={248} top={268} size={610} seed={0.2} />
      <OrbRings left={214} top={234} size={678} opacity={0.22} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            ...revealStyle(reveal, 28, 0.97, 14),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 26,
          }}
        >
          <BrandLockup centered />
          <div
            style={{
              ...panelStyle(999),
              padding: '16px 22px',
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.inkSoft,
            }}
          >
            {BRAND.tagline}
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

const ValueScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const headline = enterProgress(frame, fps, 8, 16, 118);
  const body = enterProgress(frame, fps, 18, 16, 118);

  return (
    <SceneShell duration={DURATIONS.value}>
      <PremiumBlob left={604} top={284} size={360} seed={1.1} opacity={0.94} blur={1} />
      <OrbRings left={592} top={274} size={386} opacity={0.16} />

      <div style={{display: 'flex', flexDirection: 'column', gap: 30, maxWidth: 540}}>
        <AccentKicker label="Tu hogar, mas simple" />
        <div style={{...revealStyle(headline, 26, 0.97, 12), display: 'flex', flexDirection: 'column', gap: 18}}>
          <div
            style={{
              fontSize: 86,
              lineHeight: 0.94,
              letterSpacing: '-0.06em',
              fontWeight: 800,
            }}
          >
            Todo lo que tu hogar necesita
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.32,
              color: COLORS.inkSoft,
              maxWidth: 520,
            }}
          >
            En un solo lugar. Rapido, simple y confiable.
          </div>
        </div>
        <div style={{...revealStyle(body, 18, 0.985, 8), display: 'flex', flexWrap: 'wrap', gap: 14}}>
          {VALUE_PILLS.map((pill, index) => (
            <div
              key={pill}
              style={{
                ...panelStyle(999),
                padding: '14px 18px',
                fontSize: 18,
                fontWeight: 700,
                color: index === 1 ? COLORS.blueDeep : COLORS.inkSoft,
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 26,
          top: 412,
          width: 360,
          display: 'grid',
          gap: 16,
        }}
      >
        {SERVICES.map((service, index) => (
          <Floating key={service.label} delay={0.35 + index * 0.2} x={8} y={10} rotate={0.9}>
            <ServiceMiniToken
              label={service.label}
              icon={service.icon}
              delay={16 + index * 5}
            />
          </Floating>
        ))}
      </div>
    </SceneShell>
  );
};

const CatalogScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = enterProgress(frame, fps, 4, 16, 120);

  return (
    <SceneShell duration={DURATIONS.catalog}>
      <PremiumBlob left={718} top={1126} size={280} seed={2.2} opacity={0.78} blur={10} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
        <AccentKicker label="Servicios curados" />
        <div style={{...revealStyle(intro, 24, 0.97, 12), display: 'flex', flexDirection: 'column', gap: 14}}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              fontWeight: 800,
            }}
          >
            Servicios para el hogar
          </div>
          <div style={{fontSize: 28, lineHeight: 1.34, color: COLORS.inkSoft}}>
            Organizado, claro y listo para resolver cada necesidad.
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 370,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 22,
        }}
      >
        {SERVICES.map((service, index) => (
          <ServiceCard
            key={service.label}
            index={index}
            label={service.label}
            subtitle={service.subtitle}
            icon={service.icon}
          />
        ))}
      </div>
    </SceneShell>
  );
};

const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = enterProgress(frame, fps, 4, 16, 118);

  const nodePositions = [
    {left: 344, top: 360},
    {left: 92, top: 700},
    {left: 616, top: 894},
    {left: 344, top: 1268},
  ] as const;

  const lineProgress = enterProgress(frame, fps, 20, 16, 120);
  const dashOffset = interpolate(lineProgress, [0, 1], [520, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneShell duration={DURATIONS.flow}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
        <AccentKicker label="Como funciona" />
        <div style={{...revealStyle(title, 24, 0.97, 12), display: 'flex', flexDirection: 'column', gap: 14}}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              fontWeight: 800,
              maxWidth: 720,
            }}
          >
            Pedir ayuda nunca fue tan simple
          </div>
          <div style={{fontSize: 28, lineHeight: 1.34, color: COLORS.inkSoft, maxWidth: 700}}>
            Un flujo claro, elegante y facil de entender desde el primer toque.
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 1080 1920"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          opacity: 0.78,
        }}
      >
        <path
          d="M525 520 C460 630 365 700 280 785"
          stroke="rgba(44,102,229,0.18)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="520 520"
          strokeDashoffset={dashOffset}
        />
        <path
          d="M460 930 C560 960 650 1040 770 1118"
          stroke="rgba(44,102,229,0.18)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="520 520"
          strokeDashoffset={dashOffset}
        />
        <path
          d="M770 1280 C690 1380 625 1440 525 1518"
          stroke="rgba(44,102,229,0.18)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="520 520"
          strokeDashoffset={dashOffset}
        />
        <circle
          cx={interpolate(Math.min(1, frame / 70), [0, 1], [525, 280])}
          cy={interpolate(Math.min(1, frame / 70), [0, 1], [520, 785])}
          r="7"
          fill="rgba(44,102,229,0.68)"
        />
      </svg>

      {FLOW_STEPS.map((step, index) => (
        <FlowNode
          key={step.step}
          index={index}
          left={nodePositions[index].left}
          top={nodePositions[index].top}
          step={step.step}
          title={step.title}
          detail={step.detail}
          icon={step.icon}
        />
      ))}
    </SceneShell>
  );
};

const WhatsAppScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = enterProgress(frame, fps, 6, 16, 118);
  const panel = enterProgress(frame, fps, 14, 16, 122);

  return (
    <SceneShell duration={DURATIONS.whatsapp}>
      <PremiumBlob left={642} top={216} size={280} seed={2.8} opacity={0.55} blur={18} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620}}>
        <AccentKicker label="Contacto inmediato" />
        <div style={{...revealStyle(title, 24, 0.97, 12), display: 'flex', flexDirection: 'column', gap: 14}}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              fontWeight: 800,
            }}
          >
            Atencion rapida por WhatsApp
          </div>
          <div style={{fontSize: 28, lineHeight: 1.34, color: COLORS.inkSoft}}>
            La ayuda correcta, en el momento justo y con una conversacion clara.
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 508,
          ...revealStyle(panel, 24, 0.97, 12),
          ...panelStyle(40, true),
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          boxShadow:
            '0 34px 90px rgba(28, 48, 84, 0.10), 0 0 0 1px rgba(37, 211, 102, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: 'linear-gradient(180deg, rgba(37,211,102,0.16), rgba(223,248,234,0.8))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(37, 211, 102, 0.18)',
              }}
            >
              <IconGlyph name="whatsapp" size={28} stroke={COLORS.green} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
              <div style={{fontSize: 25, fontWeight: 800}}>Chat directo</div>
              <div style={{fontSize: 17, color: COLORS.inkSoft}}>Rapido, humano y profesional</div>
            </div>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            {WHATSAPP_TAGS.map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(37, 211, 102, 0.08)',
                  color: '#218a4d',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          {WHATSAPP_MESSAGES.map((message, index) => (
            <MessageBubble
              key={`${message.author}-${index}`}
              index={index}
              side={message.side}
              author={message.author}
              text={message.text}
            />
          ))}
        </div>
      </div>
    </SceneShell>
  );
};

const TrustScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = enterProgress(frame, fps, 6, 16, 118);

  return (
    <SceneShell duration={DURATIONS.trust}>
      <PremiumBlob left={320} top={670} size={430} seed={3.4} opacity={0.92} blur={1} />
      <OrbRings left={292} top={640} size={486} opacity={0.2} />

      <div
        style={{
          position: 'absolute',
          right: 54,
          top: 248,
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          ...revealStyle(title, 24, 0.97, 12),
        }}
      >
        <AccentKicker label="Confianza real" />
        <div
          style={{
            fontSize: 70,
            lineHeight: 0.96,
            letterSpacing: '-0.05em',
            fontWeight: 800,
          }}
        >
          Confianza real, desde el primer contacto
        </div>
        <div style={{fontSize: 28, lineHeight: 1.34, color: COLORS.inkSoft}}>
          Claridad, respaldo y una experiencia profesional en cada paso.
        </div>
      </div>

      {[
        {left: 76, top: 252},
        {left: 612, top: 672},
        {left: 82, top: 1152},
        {left: 604, top: 1328},
      ].map((position, index) => {
        const badge = TRUST_BADGES[index];
        return (
          <TrustBadgeCard
            key={badge.title}
            index={index}
            left={position.left}
            top={position.top}
            title={badge.title}
            subtitle={badge.subtitle}
            icon={badge.icon}
          />
        );
      })}
    </SceneShell>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = enterProgress(frame, fps, 8, 15, 116);
  const sub = enterProgress(frame, fps, 18, 15, 116);

  return (
    <SceneShell duration={DURATIONS.cta}>
      <PremiumBlob left={186} top={1140} size={700} seed={4.1} opacity={0.9} />
      <OrbRings left={156} top={1110} size={760} opacity={0.14} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 28,
        }}
      >
        <div style={{...revealStyle(reveal, 28, 0.97, 14), display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center'}}>
          <BrandLockup centered subline={BRAND.subtagline} />
          <div
            style={{
              fontSize: 92,
              lineHeight: 0.94,
              letterSpacing: '-0.06em',
              fontWeight: 800,
              maxWidth: 820,
            }}
          >
            Tu hogar, en buenas manos
          </div>
        </div>
        <div style={{...revealStyle(sub, 20, 0.985, 10), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
          <div style={{fontSize: 30, lineHeight: 1.34, color: COLORS.inkSoft}}>
            Reserva tu servicio en minutos
          </div>
          <div style={{display: 'flex', gap: 16}}>
            <ActionButton label={BRAND.ctaPrimary} />
            <ActionButton label={BRAND.ctaSecondary} variant="secondary" />
          </div>
          <div
            style={{
              ...panelStyle(999),
              padding: '14px 20px',
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.inkSoft,
            }}
          >
            {BRAND.domain}
          </div>
          <div style={{fontSize: 18, color: COLORS.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase'}}>
            {BRAND.city}
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

export const Servicios360PremiumVertical: React.FC = () => {
  let cursor = 0;
  const introFrom = cursor;
  cursor += DURATIONS.intro;
  const valueFrom = cursor;
  cursor += DURATIONS.value;
  const catalogFrom = cursor;
  cursor += DURATIONS.catalog;
  const flowFrom = cursor;
  cursor += DURATIONS.flow;
  const whatsappFrom = cursor;
  cursor += DURATIONS.whatsapp;
  const trustFrom = cursor;
  cursor += DURATIONS.trust;
  const ctaFrom = cursor;

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.paper}}>
      <AmbientBackground />

      <Sequence from={introFrom} durationInFrames={DURATIONS.intro}>
        <IntroScene />
      </Sequence>

      <Sequence from={valueFrom} durationInFrames={DURATIONS.value}>
        <ValueScene />
      </Sequence>

      <Sequence from={catalogFrom} durationInFrames={DURATIONS.catalog}>
        <CatalogScene />
      </Sequence>

      <Sequence from={flowFrom} durationInFrames={DURATIONS.flow}>
        <FlowScene />
      </Sequence>

      <Sequence from={whatsappFrom} durationInFrames={DURATIONS.whatsapp}>
        <WhatsAppScene />
      </Sequence>

      <Sequence from={trustFrom} durationInFrames={DURATIONS.trust}>
        <TrustScene />
      </Sequence>

      <Sequence from={ctaFrom} durationInFrames={DURATIONS.cta}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

