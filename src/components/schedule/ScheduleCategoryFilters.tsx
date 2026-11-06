/**
 * ScheduleCategoryFilters Component
 * Horizontally scrollable category filter chips with dynamic booking counts:
 * அனைத்தும், ஜாதகம், கோவில், வெளி நிகழ்வு.
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookingCategory } from '../../types/schedule';

interface CategoryItem {
  id: BookingCategory;
  label: string;
  count: number;
}

interface ScheduleCategoryFiltersProps {
  selectedCategory: BookingCategory;
  onSelectCategory: (category: BookingCategory) => void;
  categories: CategoryItem[];
}

export const ScheduleCategoryFilters: React.FC<ScheduleCategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  const { i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipNormal,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${cat.label} (${cat.count})`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.chipText,
                  isTa && styles.chipTextTamil,
                  isSelected ? styles.chipTextSelected : styles.chipTextNormal,
                ]}
              >
                {cat.label} ({cat.count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipNormal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#074735', // Deep Forest Green
    borderWidth: 1,
    borderColor: '#074735',
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextTamil: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  chipTextNormal: {
    color: '#334155',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
