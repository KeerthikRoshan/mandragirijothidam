/**
 * TempleGopuramIcon Component
 * Custom SVG silhouette of a traditional South Indian Temple Gopuram
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface TempleGopuramIconProps {
  size?: number;
  color?: string;
}

export const TempleGopuramIcon: React.FC<TempleGopuramIconProps> = ({
  size = 24,
  color = '#C5A869',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 3 Kalasams (Pinnacles) on top */}
      <Path
        d="M12 2V3.5M8.5 2.5V3.5M15.5 2.5V3.5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {/* Top ridge / cornice */}
      <Rect
        x={7}
        y={3.5}
        width={10}
        height={1.5}
        rx={0.5}
        fill={color}
      />
      {/* Upper tier */}
      <Path
        d="M8 5L7 8H17L16 5H8Z"
        stroke={color}
        strokeWidth={1.2}
        fill="none"
      />
      {/* Mid ridge */}
      <Rect
        x={5.5}
        y={8}
        width={13}
        height={1.5}
        rx={0.5}
        fill={color}
      />
      {/* Middle tier */}
      <Path
        d="M6.5 9.5L5.5 13H18.5L17.5 9.5H6.5Z"
        stroke={color}
        strokeWidth={1.2}
        fill="none"
      />
      {/* Lower ridge */}
      <Rect
        x={4}
        y={13}
        width={16}
        height={1.5}
        rx={0.5}
        fill={color}
      />
      {/* Base temple tier with sanctum archway portal */}
      <Path
        d="M4.5 14.5V21H9V18C9 16.34 10.34 15 12 15C13.66 15 15 16.34 15 18V21H19.5V14.5H4.5Z"
        stroke={color}
        strokeWidth={1.3}
        fill="none"
      />
      {/* Base platform */}
      <Path
        d="M3 21H21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};
