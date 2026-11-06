/**
 * PriestHeader Component
 * Top app bar for Priest & Assistant screen, matching the design of
 * ScheduleHeader (நாள்வாரி / Daily Schedule screen header).
 *
 * Layout:
 * - Left: Back / Navigation button (ArrowLeft in styled rounded button)
 * - Center: Tamil Title ("புரோகிதர் & உதவியாளர்") and English Subtitle ("Priest & Assistant")
 * - Right: Team / Staff icon button (Users in styled rounded button)
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface PriestHeaderProps {
  onPressBack?: () => void;
  onPressAdd?: () => void;
  onPressAction?: () => void;
  activeCount?: number;
}

export const PriestHeader: React.FC<PriestHeaderProps> = ({
  onPressBack,
  onPressAdd,
  onPressAction,
  activeCount,
}) => {
  const { t } = useTranslation();
  const handleAction = onPressAdd || onPressAction;

  return (
    <View style={styles.headerContainer}>
      {/* Back / Navigation button */}
      <Pressable
        onPress={onPressBack}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft size={22} color="#074735" />
      </Pressable>

      {/* Center Title & Subtitle */}
      <View style={styles.titleContainer}>
        <Text style={styles.tamilTitle}>{t('priest.title')}</Text>
        <Text style={styles.englishSubtitle}>{t('priest.subtitle')}</Text>
      </View>

      {/* Right Action button: Add Priest */}
      <Pressable
        onPress={handleAction}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel={
          onPressAdd
            ? t('priest.modal.title')
            : activeCount
            ? t('priest.activeStaffPill', { count: activeCount })
            : 'Team'
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <UserPlus size={20} color="#074735" />
      </Pressable>
    </View>
  );
};


const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tamilTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: 0.3,
  },
  englishSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    marginTop: 1,
  },
});
