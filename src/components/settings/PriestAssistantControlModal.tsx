/**
 * PriestAssistantControlModal Component (புரோகிதர் & உதவியாளர் கட்டுப்பாடு)
 *
 * Implements the Priest & Assistant Control management screen replicating the exact
 * reference design with pixel precision:
 * - Circular back button and Add Staff button in header.
 * - Rounded search bar with "Search (by name, role, phone)...".
 * - "ACTIVE / INACTIVE STAFF CONTROL" section header.
 * - Segmented filter tabs with live count badges ("All Staff 2", "• Active 1", "• Inactive 1").
 * - Dynamic staff cards with:
 *   - Avatar with verified check badge (for inactive/certified) or active green dot badge.
 *   - Name, Tamil subtitle, and designation chip ("Chief Priest" / "புரோகிதர்").
 *   - Status pill badge ("• Inactive" or "• Active").
 *   - Dotted divider line.
 *   - Masked phone number and right-aligned "Call Priest" button.
 *   - Interactive "Slide to Activate →" and "Slide to Deactivate →" gesture sliders.
 *   - Circular soft-red delete button with Trash2 icon.
 * - Footer showing "Showing {count} registered temple priests & assistants".
 * - Backend API integration: GET /api/v1/staff and PUT /api/v1/staff/:id.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Phone,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { PriestStaffItem, PriestStatus } from '../../types/priest';
import { staffService } from '../../services/staffService';
import { showToast } from '../common/AppToast';
import { AddPriestModal } from '../priest/AddPriestModal';
import { useTranslation } from 'react-i18next';

interface PriestAssistantControlModalProps {
  visible: boolean;
  onClose: () => void;
  initialFilter?: 'all' | 'active' | 'inactive';
}

type StaffFilter = 'all' | 'active' | 'inactive';

// ============================================================================
// ACTIVATE / DEACTIVATE SLIDER COMPONENT
// ============================================================================

interface ActivateDeactivateSliderProps {
  isActive: boolean;
  isProcessing: boolean;
  onSlide: () => void;
  disabled?: boolean;
}

const THUMB_SIZE = 40;
const TRACK_PADDING = 4;

export const ActivateDeactivateSlider: React.FC<ActivateDeactivateSliderProps> = ({
  isActive,
  isProcessing,
  onSlide,
  disabled = false,
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(240);
  const maxSlide = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PADDING * 2);
  const panX = useRef(new Animated.Value(0)).current;
  const isSlidingRef = useRef(false);

  // Reset slider position when active state changes or processing stops
  useEffect(() => {
    panX.setValue(0);
    isSlidingRef.current = false;
  }, [isActive, isProcessing, panX]);

  const triggerSlideComplete = useCallback(() => {
    if (disabled || isProcessing) return;
    isSlidingRef.current = true;
    const targetDistance = maxSlide > 0 ? maxSlide : 160;

    Animated.timing(panX, {
      toValue: targetDistance,
      duration: 160,
      useNativeDriver: false,
    }).start(() => {
      onSlide();
      Animated.timing(panX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        isSlidingRef.current = false;
      });
    });
  }, [disabled, isProcessing, maxSlide, onSlide, panX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !isProcessing,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !disabled && !isProcessing && Math.abs(gestureState.dx) > 4,
        onPanResponderGrant: () => {
          isSlidingRef.current = true;
        },
        onPanResponderMove: (_, gestureState) => {
          const clamped = Math.max(0, Math.min(gestureState.dx, maxSlide));
          panX.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          const threshold = Math.max(45, maxSlide * 0.4);
          if (gestureState.dx >= threshold || gestureState.vx > 0.4) {
            triggerSlideComplete();
          } else {
            Animated.spring(panX, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: false,
            }).start(() => {
              isSlidingRef.current = false;
            });
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => {
            isSlidingRef.current = false;
          });
        },
      }),
    [disabled, isProcessing, maxSlide, panX, triggerSlideComplete]
  );

  return (
    <Pressable
      disabled={disabled || isProcessing}
      onPress={triggerSlideComplete}
      onLayout={e => {
        const width = e.nativeEvent.layout.width;
        if (width > 0) setTrackWidth(width);
      }}
      style={[
        sliderStyles.track,
        isActive ? sliderStyles.trackActive : sliderStyles.trackInactive,
        disabled && sliderStyles.trackDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isActive
          ? 'Slide to Deactivate (முடக்கு)'
          : 'Slide to Activate (செயல்படுத்து)'
      }
    >
      {/* Centered Track Text */}
      <View style={sliderStyles.textContainer} pointerEvents="none">
        <Text
          style={[
            sliderStyles.trackText,
            isActive ? sliderStyles.trackTextActive : sliderStyles.trackTextInactive,
          ]}
        >
          {isActive ? 'Slide to Deactivate →' : 'Slide to Activate →'}
        </Text>
      </View>

      {/* Screen Reader Accessible Status */}
      <Text style={sliderStyles.srOnlyText}>
        {isActive ? 'Deactivate' : 'Activate'}
      </Text>

      {/* Sliding Thumb Circle */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          sliderStyles.thumb,
          isActive ? sliderStyles.thumbActive : sliderStyles.thumbInactive,
          { transform: [{ translateX: panX }] },
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.6} />
        )}
      </Animated.View>
    </Pressable>
  );
};

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export const PriestAssistantControlModal: React.FC<PriestAssistantControlModalProps> = ({
  visible,
  onClose,
  initialFilter = 'all',
}) => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const isTamil = (i18n.language || 'ta').startsWith('ta');

  const [staffList, setStaffList] = useState<PriestStaffItem[]>(() =>
    staffService.getAllStaff()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [processingStaffId, setProcessingStaffId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<
    'activate' | 'deactivate' | 'delete' | null
  >(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<StaffFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

  // Fetch staff directory from backend database: GET /api/v1/staff
  const loadStaffDirectory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await staffService.fetchStaff({ status: 'all' });
      setStaffList(data);
    } catch (error) {
      console.warn('Failed to fetch staff in control modal:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch when modal opens
  useEffect(() => {
    if (visible) {
      loadStaffDirectory();
    }
  }, [visible, loadStaffDirectory]);

  // Sync with staffService updates
  useEffect(() => {
    const unsubscribe = staffService.subscribe(() => {
      setStaffList(staffService.getAllStaff());
    });
    return unsubscribe;
  }, []);

  // Update filter when initialFilter changes
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter, visible]);

  // Filter out soft-deleted records
  const nonDeletedStaff = useMemo(() => {
    return staffList.filter(
      s => s.status !== 'deleted' && !(s as any).isDeleted
    );
  }, [staffList]);

  // Statistics strictly derived from live database records
  const totalCount = nonDeletedStaff.length;
  const activeCount = useMemo(
    () => nonDeletedStaff.filter(s => s.status === 'active').length,
    [nonDeletedStaff]
  );
  const inactiveCount = useMemo(
    () => nonDeletedStaff.filter(s => s.status === 'inactive').length,
    [nonDeletedStaff]
  );

  // Filtered staff list
  const displayedStaff = useMemo(() => {
    return nonDeletedStaff.filter(staff => {
      // 1. Status Filter
      if (activeFilter === 'active' && staff.status !== 'active') return false;
      if (activeFilter === 'inactive' && staff.status !== 'inactive') return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNameEn = (staff.nameEnglish || '').toLowerCase().includes(q);
        const matchesNameTa = (staff.nameTamil || '').includes(q);
        const matchesRole = (staff.role || staff.roleBadge || '').toLowerCase().includes(q);
        const matchesDesig = (staff.designationTamil || staff.designationEnglish || '').toLowerCase().includes(q);
        const matchesPhone = (staff.phone || '').includes(q);
        return matchesNameEn || matchesNameTa || matchesRole || matchesDesig || matchesPhone;
      }

      return true;
    });
  }, [nonDeletedStaff, activeFilter, searchQuery]);

  // Phone Call handler
  const handleCallStaff = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {
        showToast({
          type: 'info',
          message: `${phone}`,
        });
      });
    }
  };

  // PUT /api/v1/staff/:id -> Activate / Deactivate Action Handler
  const handleToggleStatus = (staff: PriestStaffItem) => {
    if (processingStaffId) return; // Prevent multiple submissions while an action is processing

    const isDeactivating = staff.status === 'active';
    const newStatus: PriestStatus = isDeactivating ? 'inactive' : 'active';
    const targetStatusApi = isDeactivating ? 'Inactive' : 'Active';

    const performToggle = async () => {
      setProcessingStaffId(staff.id);
      setProcessingAction(isDeactivating ? 'deactivate' : 'activate');

      try {
        const result = await staffService.updateStaffApi(staff.id, {
          status: targetStatusApi,
          staff: { status: targetStatusApi },
        });

        if (result.success) {
          // Immediate UI Reflection
          staffService.updateStaffStatus(staff.id, newStatus);

          if (isDeactivating) {
            showToast({
              type: 'warning',
              message: isTamil
                ? `${staff.nameTamil || staff.nameEnglish} முடக்கப்பட்டுள்ளார் (Deactivated)`
                : `${staff.nameEnglish || staff.nameTamil} has been deactivated`,
            });
          } else {
            showToast({
              type: 'success',
              message: isTamil
                ? `${staff.nameTamil || staff.nameEnglish} செயல்படுத்தப்பட்டார் (Activated)`
                : `${staff.nameEnglish || staff.nameTamil} has been activated`,
            });
          }

          // Step 5: Background GET refresh to synchronize with live database
          staffService.fetchStaff({ status: 'all' }).catch(err => {
            console.warn('Background sync failed:', err);
          });
        } else {
          showToast({
            type: 'error',
            message:
              result.message ||
              t('settings.updateFailed', 'புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'),
          });
        }
      } catch (err: any) {
        showToast({
          type: 'error',
          message:
            err?.message ||
            t('settings.updateFailed', 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'),
        });
      } finally {
        setProcessingStaffId(null);
        setProcessingAction(null);
      }
    };

    if (isDeactivating) {
      Alert.alert(
        t('settings.deactivateConfirmTitle', 'பணியாளரை முடக்கவா? (Deactivate Staff?)'),
        t(
          'settings.deactivateConfirmMessage',
          `${staff.nameTamil || staff.nameEnglish} அவர்களின் கணக்கை முடக்க விரும்புகிறீர்களா? முடக்கப்பட்ட பணியாளர்களால் செயலியில் உள்நுழைய இயலாது.`,
          { name: isTamil ? staff.nameTamil : staff.nameEnglish }
        ),
        [
          { text: t('common.cancel', 'ரத்து'), style: 'cancel' },
          {
            text: t('settings.btnDeactivate', 'முடக்குக (Deactivate)'),
            style: 'destructive',
            onPress: performToggle,
          },
        ]
      );
    } else {
      performToggle();
    }
  };

  // PUT /api/v1/staff/:id -> Soft Delete Action Handler
  const handleDeleteStaff = (staff: PriestStaffItem) => {
    if (processingStaffId) return; // Prevent multiple submissions while an action is processing

    Alert.alert(
      t('settings.deleteConfirmTitle', 'பணியாளரை நீக்கவா?'),
      t(
        'settings.deleteConfirmMessage',
        `${staff.nameTamil || staff.nameEnglish} அவர்களின் பணியாளர் கணக்கை நீக்க விரும்புகிறீர்களா? இதனால் இவர்கள் குழுவிலிருந்து முற்றிலும் நீக்கப்படுவர்.`,
        { name: isTamil ? staff.nameTamil : staff.nameEnglish }
      ),
      [
        { text: t('common.cancel', 'ரத்து'), style: 'cancel' },
        {
          text: t('settings.btnDelete', 'நீக்கு (Fire)'),
          style: 'destructive',
          onPress: async () => {
            setProcessingStaffId(staff.id);
            setProcessingAction('delete');

            try {
              const result = await staffService.updateStaffApi(staff.id, {
                isDeleted: true,
                status: 'DELETED',
                staff: { isDeleted: true, status: 'DELETED' },
              });

              if (result.success) {
                // Immediate UI Reflection
                staffService.deleteStaff(staff.id);

                showToast({
                  type: 'success',
                  message: isTamil
                    ? `${staff.nameTamil || staff.nameEnglish} நீக்கப்பட்டார் (Removed)`
                    : `${staff.nameEnglish || staff.nameTamil} has been removed`,
                });

                // Step 5: Background GET refresh to synchronize with live database
                staffService.fetchStaff({ status: 'all' }).catch(err => {
                  console.warn('Background sync failed:', err);
                });
              } else {
                showToast({
                  type: 'error',
                  message:
                    result.message ||
                    t('settings.deleteFailed', 'நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'),
                });
              }
            } catch (err: any) {
              showToast({
                type: 'error',
                message:
                  err?.message ||
                  t('settings.deleteFailed', 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'),
              });
            } finally {
              setProcessingStaffId(null);
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  };

  const handleAddStaffSubmit = (newStaff: PriestStaffItem) => {
    setIsAddModalVisible(false);
    staffService.fetchStaff({ status: 'all' }).catch(err => console.warn(err));
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Top App Bar Header with Circular Buttons */}
        <View style={styles.headerContainer}>
          {/* Back Button */}
          <Pressable
            onPress={onClose}
            style={styles.headerCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.goBack', 'Go back')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#074735" />
          </Pressable>

          {/* Centered Title & Subtitle */}
          <View style={styles.headerTitleContainer}>
            <Text
              style={[
                styles.headerMainTitle,
                isTamil && styles.headerMainTitleTamil,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {isTamil
                ? t('settings.priestControlTitle', 'புரோகிதர் & உதவியாளர் கட்டுப்பாடு')
                : 'Priest & Assistant Control'}
            </Text>
            <Text style={styles.headerSubTitle} numberOfLines={1}>
              Priest & Assistant Control
            </Text>
          </View>

          {/* Add Staff Button */}
          <Pressable
            onPress={() => setIsAddModalVisible(true)}
            style={styles.headerCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('settings.addStaffBtn', '+ புதிய பணியாளர் சேர்க்க')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UserPlus size={20} color="#074735" />
          </Pressable>
        </View>

        {/* Search Bar matching Reference UI */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder={t(
                'settings.searchStaffPlaceholder',
                'Search (by name, role, phone)...'
              )}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search"
                style={styles.searchClearBtn}
              >
                <X size={15} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Section Header: ACTIVE / INACTIVE STAFF CONTROL */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            {isTamil
              ? t(
                  'settings.itemActiveInactiveControl',
                  'செயல் / முடக்கம் பணியாளர் கட்டுப்பாடு'
                )
              : 'Active / Inactive Staff Control'}
          </Text>
        </View>

        {/* Filter Segment Pills Row with Individual Badges */}
        <View style={styles.filterSection}>
          <View style={styles.filterTabsRow}>
            {/* All Staff Tab */}
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={[
                styles.filterTab,
                activeFilter === 'all' && styles.filterTabSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`All Staff (${totalCount})`}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'all' && styles.filterTabTextSelected,
                ]}
              >
                {isTamil ? 'அனைத்தும்' : 'All Staff'}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  activeFilter === 'all' && styles.filterBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    activeFilter === 'all' && styles.filterBadgeTextSelected,
                  ]}
                >
                  {totalCount}
                </Text>
              </View>
            </Pressable>

            {/* Active Tab */}
            <Pressable
              onPress={() => setActiveFilter('active')}
              style={[
                styles.filterTab,
                activeFilter === 'active' && styles.filterTabSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Active (${activeCount})`}
            >
              <View style={styles.filterDotGreen} />
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'active' && styles.filterTabTextSelected,
                ]}
              >
                {isTamil ? 'செயலில்' : 'Active'}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  activeFilter === 'active' && styles.filterBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    activeFilter === 'active' && styles.filterBadgeTextSelected,
                  ]}
                >
                  {activeCount}
                </Text>
              </View>
            </Pressable>

            {/* Inactive Tab */}
            <Pressable
              onPress={() => setActiveFilter('inactive')}
              style={[
                styles.filterTab,
                activeFilter === 'inactive' && styles.filterTabSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Inactive (${inactiveCount})`}
            >
              <View style={styles.filterDotAmber} />
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'inactive' && styles.filterTabTextSelected,
                ]}
              >
                {isTamil ? 'முடக்கப்பட்டவை' : 'Inactive'}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  activeFilter === 'inactive' && styles.filterBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    activeFilter === 'inactive' && styles.filterBadgeTextSelected,
                  ]}
                >
                  {inactiveCount}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Staff Members List */}
        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadStaffDirectory(true)}
              colors={['#074735']}
              tintColor="#074735"
            />
          }
        >
          {isLoading && staffList.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#074735" />
              <Text style={styles.loadingText}>
                {t('common.loading', 'பணியாளர்கள் விவரங்கள் ஏற்றப்படுகின்றன...')}
              </Text>
            </View>
          ) : displayedStaff.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={38} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {t('settings.noStaffFound', 'பணியாளர்கள் விபரம் எதுவும் இல்லை.')}
              </Text>
              <Text style={styles.emptySub}>
                {t(
                  'settings.emptySearchSub',
                  'தேடல் அல்லது வடிகட்டி விபரங்களை சரிபார்க்கவும்.'
                )}
              </Text>
            </View>
          ) : (
            <>
              {displayedStaff.map(staff => {
                const isActive = staff.status === 'active';
                const isCardProcessing = processingStaffId === staff.id;
                const roleBadgeText =
                  staff.role ||
                  staff.roleBadge ||
                  (isTamil ? 'Priest' : 'Priest');
                const designationBadgeText =
                  staff.designationEnglish ||
                  staff.designationTamil ||
                  staff.designation ||
                  'Chief Priest';

                // Two-letter initials
                const initials = (staff.nameEnglish || staff.nameTamil || 'ST')
                  .slice(0, 2)
                  .toUpperCase();

                // Masked phone display
                const phoneTextDisplay =
                  staff.phoneDisplay ||
                  (staff.phone && staff.phone.length > 5
                    ? `${staff.phone.slice(0, 5)}XXXXX`
                    : staff.phone || '91987XXXXXXX');

                return (
                  <View key={staff.id} style={styles.staffCard}>
                    {/* Top Row: Avatar + Details + Status Pill */}
                    <View style={styles.cardTopRow}>
                      {/* Avatar with Status/Verified Badge */}
                      <View style={styles.avatarWrapper}>
                        {!imageErrors[staff.id] && staff.avatar ? (
                          <Image
                            source={staff.avatar}
                            style={styles.avatarImage}
                            resizeMode="cover"
                            onError={() =>
                              setImageErrors(prev => ({
                                ...prev,
                                [staff.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Text style={styles.avatarFallbackText}>
                              {initials}
                            </Text>
                          </View>
                        )}

                        {/* Avatar Bottom-Right Status Indicator Badge */}
                        {isActive ? (
                          <View style={styles.avatarActiveDotBadge} />
                        ) : (
                          <View style={styles.avatarVerifiedBadge}>
                            <Check size={9} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </View>

                      {/* Staff Names & Role Info */}
                      <View style={styles.staffDetailsColumn}>
                        {/* Primary Name */}
                        <Text style={styles.staffPrimaryName} numberOfLines={1}>
                          {staff.nameEnglish || staff.nameTamil}
                        </Text>

                        {/* Secondary Subtitle: Tamil Name • Role */}
                        <Text style={styles.staffSecondarySub} numberOfLines={1}>
                          {(staff.nameTamil && staff.nameTamil !== staff.nameEnglish
                            ? staff.nameTamil
                            : '') +
                            (staff.nameTamil && staff.nameTamil !== staff.nameEnglish
                              ? ' • '
                              : '') +
                            roleBadgeText}
                        </Text>

                        {/* Designation Chip */}
                        <View
                          style={[
                            styles.designationChip,
                            isActive && styles.designationChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.designationChipText,
                              isActive && styles.designationChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {designationBadgeText}
                          </Text>
                        </View>
                      </View>

                      {/* Status Pill Badge (Top Right) */}
                      <View
                        style={[
                          styles.cardStatusPill,
                          isActive
                            ? styles.cardStatusPillActive
                            : styles.cardStatusPillInactive,
                        ]}
                      >
                        <View
                          style={[
                            styles.cardStatusDot,
                            isActive
                              ? styles.cardStatusDotGreen
                              : styles.cardStatusDotAmber,
                          ]}
                        />
                        <Text
                          style={[
                            styles.cardStatusText,
                            isActive
                              ? styles.cardStatusTextActive
                              : styles.cardStatusTextInactive,
                          ]}
                        >
                          {isActive
                            ? isTamil
                              ? 'Active'
                              : 'Active'
                            : isTamil
                            ? 'Inactive'
                            : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    {/* Dotted Divider Line */}
                    <View style={styles.dottedDivider} />

                    {/* Middle Row: Phone Icon + Number and "Call Priest" Button */}
                    <View style={styles.phoneActionRow}>
                      <View style={styles.phoneLeftBox}>
                        <View style={styles.phoneIconSquare}>
                          <Phone size={12} color="#64748B" />
                        </View>
                        <Text style={styles.phoneNumberText}>
                          {phoneTextDisplay}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleCallStaff(staff.phone)}
                        style={styles.callPriestBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${staff.nameEnglish || staff.nameTamil}`}
                      >
                        <Phone size={11} color="#059669" />
                        <Text style={styles.callPriestBtnText}>
                          Call Priest
                        </Text>
                      </Pressable>
                    </View>

                    {/* Bottom Action Row: Slider + Circular Delete Button */}
                    <View style={styles.bottomActionsRow}>
                      {/* Activate / Deactivate Slider */}
                      <ActivateDeactivateSlider
                        isActive={isActive}
                        isProcessing={
                          isCardProcessing &&
                          (processingAction === 'activate' ||
                            processingAction === 'deactivate')
                        }
                        onSlide={() => handleToggleStatus(staff)}
                        disabled={!!processingStaffId}
                      />

                      {/* Circular Delete Button */}
                      <Pressable
                        disabled={!!processingStaffId}
                        onPress={() => handleDeleteStaff(staff)}
                        style={[
                          styles.deleteCircleBtn,
                          isCardProcessing &&
                            processingAction === 'delete' &&
                            styles.btnProcessing,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          'settings.btnDelete',
                          'Delete (Fire)'
                        )}
                      >
                        {isCardProcessing && processingAction === 'delete' ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <Trash2 size={18} color="#DC2626" />
                        )}
                        {/* Hidden Text for screen readers and bilingual test assertions */}
                        <Text style={styles.srOnlyText}>
                          {t('settings.btnDelete', 'Delete (Fire)')}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {/* List Footer Summary */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  {`Showing ${displayedStaff.length} registered temple priests & assistants`}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Add New Priest Modal */}
        <AddPriestModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          onSubmit={handleAddStaffSubmit}
        />
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLESHEET
// ============================================================================

const sliderStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trackInactive: {
    backgroundColor: '#ECFDF5', // Mint green background
    borderColor: '#A7F3D0',
  },
  trackActive: {
    backgroundColor: '#FFFBEB', // Light warm amber background
    borderColor: '#FDE68A',
  },
  trackDisabled: {
    opacity: 0.6,
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 24,
  },
  trackText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  trackTextInactive: {
    color: '#074735', // Deep green text
  },
  trackTextActive: {
    color: '#92400E', // Amber-brown text
  },
  thumb: {
    position: 'absolute',
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbInactive: {
    backgroundColor: '#074735', // Dark Vedic green thumb circle
  },
  thumbActive: {
    backgroundColor: '#F59E0B', // Vibrant golden amber thumb circle
  },
  srOnlyText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white / light cream background
  },
  headerContainer: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerMainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#074735',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  headerMainTitleTamil: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: 'center',
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterTabSelected: {
    backgroundColor: '#074735',
    borderColor: '#074735',
  },
  filterTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  filterBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterBadgeTextSelected: {
    color: '#FFFFFF',
  },
  filterDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  filterDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 14,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#074735',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActiveDotBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  staffDetailsColumn: {
    flex: 1,
    paddingRight: 6,
  },
  staffPrimaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  staffSecondarySub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  designationChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    marginTop: 6,
  },
  designationChipActive: {
    backgroundColor: '#ECFDF5',
  },
  designationChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  designationChipTextActive: {
    color: '#047857',
  },
  cardStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  cardStatusPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cardStatusPillInactive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  cardStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardStatusDotGreen: {
    backgroundColor: '#10B981',
  },
  cardStatusDotAmber: {
    backgroundColor: '#F59E0B',
  },
  cardStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardStatusTextActive: {
    color: '#047857',
  },
  cardStatusTextInactive: {
    color: '#B45309',
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  phoneActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneLeftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneIconSquare: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNumberText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#334155',
  },
  callPriestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
  },
  callPriestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  deleteCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  srOnlyText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  btnProcessing: {
    opacity: 0.6,
  },
});
