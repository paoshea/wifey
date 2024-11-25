import { brandConfig } from './config';

type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type ColorType = keyof typeof brandConfig.colors;

export function getBrandColor(type: ColorType, shade: ColorShade): string {
  return brandConfig.colors[type][shade];
}

export function getBrandGradient(type: keyof typeof brandConfig.gradients): string {
  return brandConfig.gradients[type];
}

export function getBrandFont(type: keyof typeof brandConfig.fonts): string {
  return brandConfig.fonts[type];
}

export function getBrandSpacing(size: keyof typeof brandConfig.spacing.container): string {
  return brandConfig.spacing.container[size];
}

export function getBrandRadius(size: keyof typeof brandConfig.borderRadius): string {
  return brandConfig.borderRadius[size];
}

export function getBrandShadow(size: keyof typeof brandConfig.shadows): string {
  return brandConfig.shadows[size];
}
