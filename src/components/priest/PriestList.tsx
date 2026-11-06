/**
 * PriestList Component
 * Horizontal Priest & Assistant Selection List.
 *
 * Implements:
 * 1. Responsive card width calculated from available screen width (useWindowDimensions).
 * 2. Identical height (114dp) across all cards to eliminate uneven layouts.
 * 3. Fixed internal structure:
 *    - Circular profile avatar (40x40 fixed pixel dimensions, non-collapsing border)
 *    - staffNameContainer (fixed 20dp height, 1-line text)
 *    - staffRoleContainer (fixed 32dp height, max 2 lines with tail ellipsize)
 * 4. Image stability on Android (persists across clicks without disappearing).
 * 5. Consistent "+ சேர்க்க" (Add Staff) card aligned at matching vertical positions.
 */

import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { PriestStaffItem } from '../../types/priest';
import { useTranslation } from 'react-i18next';

interface PriestListProps {
  staffList: PriestStaffItem[];
  selectedPriestId: string;
  onSelectPriest: (priest: PriestStaffItem) => void;
  onPressAdd?: () => void;
}

export const PriestList: React.FC<PriestListProps> = ({
  staffList,
  selectedPriestId,
  onSelectPriest,
  onPressAdd,
}) => {
  const { t } = useTranslation();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { width: windowWidth } = useWindowDimensions();

  // Responsive card width: balanced for small phones (320dp) to large screens/tablets
  const safeWidth = windowWidth && windowWidth > 0 ? windowWidth : 390;
  const cardWidth = Math.max(82, Math.min(104, Math.floor((safeWidth - 32 - 30) / 3.8)));

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {staffList.map(item => {
          const isSelected = item.id === selectedPriestId;
          const hasError = imageErrors[item.id] || !item.avatar;

          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectPriest(item)}
              style={[
                styles.staffCard,
                { width: cardWidth },
                isSelected ? styles.staffCardSelected : styles.staffCardUnselected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.nameEnglish} (${item.designationTamil})`}
              accessibilityState={{ selected: isSelected }}
            >
              {/* 1. Circular Profile Avatar Container with fixed pixel sizing & static border */}
              <View
                style={[
                  styles.avatarWrapper,
                  isSelected
                    ? styles.avatarWrapperSelected
                    : styles.avatarWrapperUnselected,
                ]}
              >
                {!hasError && item.avatar ? (
                  <Image
                    key={`priest-avatar-${item.id}`}
                    source={item.avatar}
                    style={styles.staffAvatar}
                    resizeMode="cover"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <View
                    style={[
                      styles.fallbackAvatar,
                      isSelected && styles.fallbackAvatarSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fallbackText,
                        isSelected && styles.fallbackTextSelected,
                      ]}
                    >
                      {(item.nameEnglish || item.nameTamil || 'ST').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* 2. Staff English Name Container */}
              <View style={styles.staffNameContainer}>
                <Text
                  style={[
                    styles.staffName,
                    isSelected
                      ? styles.staffNameSelected
                      : styles.staffNameUnselected,
                  ]}
                  numberOfLines={1}
                >
                  {item.nameEnglish}
                </Text>
              </View>

              {/* 3. Staff Tamil Designation Container (Fixed height, max 2 lines) */}
              <View style={styles.staffRoleContainer}>
                <Text
                  style={[
                    styles.staffRole,
                    isSelected
                      ? styles.staffRoleSelected
                      : styles.staffRoleUnselected,
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.designationTamil}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* 4. Add New Staff Card at the end */}
        {onPressAdd && (
          <Pressable
            onPress={onPressAdd}
            style={[styles.addCard, { width: cardWidth }]}
            accessibilityRole="button"
            accessibilityLabel="புதிய புரோகிதர் சேர்க்க"
          >
            <View style={styles.addIconCircle}>
              <UserPlus size={18} color="#074735" />
            </View>

            <View style={styles.staffNameContainer}>
              <Text style={styles.addCardText} numberOfLines={1}>
                {t('priest.addStaffCard')}
              </Text>
            </View>

            <View style={styles.staffRoleContainer}>
              <Text style={styles.addCardSubtext} numberOfLines={1}>
                {t('priest.newStaff')}
              </Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  staffCard: {
    height: 114,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  staffCardUnselected: {
    backgroundColor: '#F1F5F3',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffCardSelected: {
    backgroundColor: '#074735', // Deep Forest Green
    borderWidth: 1.5,
    borderColor: '#C6A15B', // Gold Accent
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    backgroundColor: '#E2E8F0',
  },
  avatarWrapperUnselected: {
    borderColor: 'transparent',
  },
  avatarWrapperSelected: {
    borderColor: '#C6A15B', // Gold Accent
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fallbackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackAvatarSelected: {
    backgroundColor: '#0B3D2E',
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  fallbackTextSelected: {
    color: '#FCD34D',
  },
  staffNameContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  staffName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  staffNameUnselected: {
    color: '#1F2937',
  },
  staffNameSelected: {
    color: '#FFFFFF',
  },
  staffRoleContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  staffRole: {
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  staffRoleUnselected: {
    color: '#64748B',
    fontWeight: '600',
  },
  staffRoleSelected: {
    color: '#FCD34D', // Gold/Warm Yellow
    fontWeight: '700',
  },
  addCard: {
    height: 114,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A7C4B8',
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addCardText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#074735',
    lineHeight: 16,
    textAlign: 'center',
  },
  addCardSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 13,
    textAlign: 'center',
  },
});
