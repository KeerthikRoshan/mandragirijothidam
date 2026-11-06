/**
 * PanchangamInfoCard Component
 * Inner translucent card for individual Panchangam attributes (Tithi, Star, Auspicious Time, Rahu Kalam).
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Moon, Sparkles, Clock, AlertTriangle } from 'lucide-react-native';
import { PanchangamInnerCard } from '../../types/dashboard';

interface PanchangamInfoCardProps {
  card: PanchangamInnerCard;
}

export const PanchangamInfoCard: React.FC<PanchangamInfoCardProps> = ({ card }) => {
  const renderCategoryIcon = () => {
    switch (card.iconType) {
      case 'lotus':
        return <Sparkles size={13} color="#A8D5C2" style={styles.categoryIcon} />;
      case 'moon':
        return <Moon size={13} color="#A8D5C2" style={styles.categoryIcon} />;
      case 'time':
        return <Clock size={13} color="#A8D5C2" style={styles.categoryIcon} />;
      case 'alert':
        return <AlertTriangle size={13} color="#F87171" style={styles.categoryIcon} />;
      default:
        return null;
    }
  };

  const isSuccessBadge = card.badgeType === 'success';

  return (
    <View style={styles.cardContainer}>
      {/* Category Row with Optional Badge */}
      <View style={styles.categoryRow}>
        <View style={styles.categoryLeft}>
          {renderCategoryIcon()}
          <Text style={styles.categoryText} numberOfLines={1}>
            {card.category}
          </Text>
        </View>

        {card.badgeText && (
          <View
            style={[
              styles.badge,
              isSuccessBadge ? styles.successBadge : styles.dangerBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isSuccessBadge ? styles.successBadgeText : styles.dangerBadgeText,
              ]}
            >
              {card.badgeText}
            </Text>
          </View>
        )}
      </View>

      {/* Main Title / Time */}
      <Text style={styles.titleText} numberOfLines={1}>
        {card.title}
      </Text>

      {/* Subtitle / Ending Time */}
      <Text style={styles.subtitleText} numberOfLines={1}>
        {card.subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    minHeight: 78,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#A8D5C2',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  successBadge: {
    backgroundColor: '#A7F3D0',
  },
  dangerBadge: {
    backgroundColor: '#FECACA',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  successBadgeText: {
    color: '#065F46',
  },
  dangerBadgeText: {
    color: '#991B1B',
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  subtitleText: {
    fontSize: 10.5,
    color: '#C2E2D4',
  },
});
