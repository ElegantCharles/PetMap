import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

function Base({
  size = 22,
  color = colors.ink,
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const IconBack = (p: IconProps) => (
  <Base {...p}>
    <Path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconChevronRight = (p: IconProps) => (
  <Base {...p}>
    <Path d="M9 5l7 7-7 7" />
  </Base>
);

export const IconChevronDown = (p: IconProps) => (
  <Base {...p}>
    <Path d="M6 9l6 6 6-6" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <Path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const IconMore = ({ size = 22, color = colors.ink }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="5" cy="12" r="1.8" />
    <Circle cx="12" cy="12" r="1.8" />
    <Circle cx="19" cy="12" r="1.8" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Base strokeWidth={1.9} {...p}>
    <Rect x="3.5" y="5" width="17" height="15" rx="3" />
    <Path d="M3.5 10h17M8 3v4M16 3v4" />
  </Base>
);

// Jeringa: vacuna
export const IconSyringe = (p: IconProps) => (
  <Base strokeWidth={1.8} {...p}>
    <Path d="M18 2l4 4M17 7l3-3M19 9l-8.5 8.5-4-4L15 5M6.5 13.5L3 17l4 4 3.5-3.5M9 11l4 4" />
  </Base>
);

// Insecto: desparasitante externo
export const IconBug = (p: IconProps) => (
  <Base strokeWidth={1.8} {...p}>
    <Ellipse cx="12" cy="13.5" rx="5" ry="6.5" />
    <Path d="M12 7v13M7 12H3M7 16H4M17 12h4M17 16h3M9 4l2 3M15 4l-2 3" />
  </Base>
);

// Cápsula: desparasitante interno
export const IconPill = (p: IconProps) => (
  <Base strokeWidth={1.8} {...p}>
    <Rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
    <Path d="M9.2 15.2l5.6-6.4" />
  </Base>
);
