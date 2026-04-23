import {Composition} from 'remotion';
import {
  PROMO_DURATION_IN_FRAMES,
  PROMO_FPS,
  Servicios360ReferencePromo,
} from './Servicios360ReferencePromo';
import {
  PREMIUM_PROMO_DURATION_IN_FRAMES,
  PREMIUM_PROMO_FPS,
  Servicios360PremiumVertical,
} from './Servicios360PremiumVertical';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Servicios360PromoVertical"
        component={Servicios360PremiumVertical}
        durationInFrames={PREMIUM_PROMO_DURATION_IN_FRAMES}
        fps={PREMIUM_PROMO_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Servicios360PromoLandscape"
        component={Servicios360ReferencePromo}
        durationInFrames={PROMO_DURATION_IN_FRAMES}
        fps={PROMO_FPS}
        width={1920}
        height={1080}
        defaultProps={{variant: 'landscape'}}
      />
    </>
  );
};
