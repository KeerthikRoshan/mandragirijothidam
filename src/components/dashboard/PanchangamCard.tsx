/**
 * PanchangamCard Component
 * Section 3: Prominent deep-green Panchangam card featuring celestial SVG watermark,
 * 2x2 grid of Vedic metrics, and gold action link.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Sun, ArrowRight } from 'lucide-react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { PanchangamData } from '../../types/dashboard';
import { PanchangamInfoCard } from './PanchangamInfoCard';

interface PanchangamCardProps {
  data: PanchangamData;
  onPressViewFull?: () => void;
}

export const PanchangamCard: React.FC<PanchangamCardProps> = ({
  data,
  onPressViewFull,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Decorative Astrological Zodiac Wheel Watermark */}
      <View style={styles.watermarkContainer} pointerEvents="none">
        <Svg height="220" width="220" viewBox="0 0 200 200">
          <Circle
            cx="100"
            cy="100"
            r="90"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            fill="none"
          />
          <Circle
            cx="100"
            cy="100"
            r="65"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
            fill="none"
          />
          <Circle
            cx="100"
            cy="100"
            r="40"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="1"
            fill="none"
          />
          {/* Astrological House Radiating Spokes */}
          <Line x1="10" y1="100" x2="190" y2="100" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="0.8" />
          <Line x1="100" y1="10" x2="100" y2="190" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="0.8" />
          <Line x1="36" y1="36" x2="164" y2="164" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8" />
          <Line x1="36" y1="164" x2="164" y2="36" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8" />
        </Svg>
      </View>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Sun size={20} color="#FBBF24" style={styles.sunIcon} />
          <View>
            <Text style={styles.headingTitle}>இன்றைய</Text>
            <Text style={styles.headingTitle}>பஞ்சாங்கம்</Text>
          </View>
        </View>

        {/* Date Pill Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{data.gregorianDateBadge}</Text>
          <Text style={styles.dateBadgeText}>{data.tamilDateBadge}</Text>
        </View>
      </View>

      {/* 2-Column Grid (4 Inner Cards) */}
      <View style={styles.gridContainer}>
        {/* Row 1: Tithi & Star */}
        <View style={styles.cardsRow}>
          {data.cards[0] && <PanchangamInfoCard card={data.cards[0]} />}
          <View style={styles.cardGap} />
          {data.cards[1] && <PanchangamInfoCard card={data.cards[1]} />}
        </View>

        {/* Row 2: Nalla Neram & Rahu Kalam */}
        <View style={[styles.cardsRow, styles.rowMarginTop]}>
          {data.cards[2] && <PanchangamInfoCard card={data.cards[2]} />}
          <View style={styles.cardGap} />
          {data.cards[3] && <PanchangamInfoCard card={data.cards[3]} />}
        </View>
      </View>

      {/* Bottom Action Link */}
      <Pressable
        onPress={onPressViewFull}
        style={styles.actionRow}
        accessibilityRole="button"
        accessibilityLabel={data.actionText}
      >
        <Text style={styles.actionText}>{data.actionText}</Text>
        <ArrowRight size={15} color="#F3CA68" style={styles.arrowIcon} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    backgroundColor: '#074735', // Deep Vedic forest green
    borderRadius: 18,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  watermarkContainer: {
    position: 'absolute',
    top: -40,
    right: -40,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sunIcon: {
    marginRight: 8,
  },
  headingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C2E2D4',
  },
  gridContainer: {
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rowMarginTop: {
    marginTop: 10,
  },
  cardGap: {
    width: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F3CA68', // Gold highlight
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 6,
  },
});
