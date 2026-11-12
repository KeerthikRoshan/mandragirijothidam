/**
 * StaffMoreScreen Component
 * More Menu & Profile Screen for Priests and Assistants
 *
 * Implements:
 * 1. Staff Profile Overview (Photo, Name, Title, Tradition, Contact).
 * 2. Quick navigation to Leave Requests and My Attendance.
 * 3. Safe Sign Out functionality.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Award,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  FileText,
  LogOut,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { authService } from '../../services/auth/authService';
import { StaffBottomNav } from '../../components/staff/StaffBottomNav';
import { StaffUserProfile } from '../../types/staffPortal';
import {
  StaffMoreScreenNavigationProp,
  StaffMoreScreenRouteProp,
} from '../../types/navigation';

export const StaffMoreScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffMoreScreenNavigationProp>();
  const route = useRoute<StaffMoreScreenRouteProp>();

  const [currentStaff, setCurrentStaff] = useState<StaffUserProfile | null>(null);

  const loadStaff = useCallback(async (staffIdParam?: string) => {
    try {
      let staff: StaffUserProfile;
      if (staffIdParam) {
        staff = await authService.setStaffSession(staffIdParam);
      } else {
        staff = await authService.getCurrentStaff();
      }
      setCurrentStaff(staff);
    } catch (_e) {}
  }, []);

  useEffect(() => {
    loadStaff(route?.params?.staffId);
  }, [route?.params?.staffId, loadStaff]);

  // Sign out handler
  const handleSignOut = () => {
    Alert.alert(
      'வெளியேறு (Sign Out)',
      'பணியாளர் கணக்கிலிருந்து வெளியேற விரும்புகிறீர்களா?',
      [
        { text: 'ரத்து', style: 'cancel' },
        {
          text: 'ஆம், வெளியேறு',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>மேலும் (More & Profile)</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarBox}>
            <Text style={styles.profileAvatarInitials}>
              {currentStaff?.nameEnglish?.slice(0, 2)?.toUpperCase() || 'ST'}
            </Text>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.nameEn}>{currentStaff?.nameEnglish}</Text>
              {currentStaff?.roleBadge && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{currentStaff.roleBadge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.nameTa}>{currentStaff?.nameTamil}</Text>
            <Text style={styles.desText}>
              {currentStaff?.designationTamil} ({currentStaff?.designationEnglish})
            </Text>
            {currentStaff?.phone && (
              <View style={styles.phoneRow}>
                <Phone size={12} color="#5F7068" />
                <Text style={styles.phoneText}>
                  {currentStaff?.phoneDisplay || currentStaff?.phone}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Staff Tradition & Certification Details */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>வேத தகுதி மற்றும் ஆகம விவரம்</Text>

          {currentStaff?.traditionTamil && (
            <View style={styles.infoItemRow}>
              <BookOpen size={14} color="#074735" />
              <View style={styles.infoItemContent}>
                <Text style={styles.infoItemLabel}>ஆகம மரபு:</Text>
                <Text style={styles.infoItemVal}>{currentStaff.traditionTamil}</Text>
              </View>
            </View>
          )}

          {currentStaff?.certificationTamil && (
            <View style={styles.infoItemRow}>
              <Award size={14} color="#C6A15B" />
              <View style={styles.infoItemContent}>
                <Text style={styles.infoItemLabel}>சான்றிதழ்:</Text>
                <Text style={styles.infoItemVal}>{currentStaff.certificationTamil}</Text>
              </View>
            </View>
          )}

          {currentStaff?.expertiseTamil && (
            <View style={styles.infoItemRow}>
              <ShieldCheck size={14} color="#145C43" />
              <View style={styles.infoItemContent}>
                <Text style={styles.infoItemLabel}>சிறப்புத் தகுதி:</Text>
                <Text style={styles.infoItemVal}>{currentStaff.expertiseTamil}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 3. Navigation Group */}
        <View style={styles.menuGroup}>
          {/* Leave Requests */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Leave Requests"
            onPress={() => navigation.navigate('StaffLeaves', { staffId: currentStaff?.id })}
            style={styles.menuRow}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3F2' }]}>
              <FileText size={18} color="#B42318" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>விடுப்பு விண்ணப்பங்கள்</Text>
              <Text style={styles.menuSub}>Leave applications & approval status</Text>
            </View>
            <ChevronRight size={16} color="#98A2B3" />
          </Pressable>

          <View style={styles.menuDivider} />

          {/* My Attendance */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open My Attendance"
            onPress={() => navigation.navigate('StaffAttendance', { staffId: currentStaff?.id })}
            style={styles.menuRow}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#E8F3EB' }]}>
              <CalendarCheck size={18} color="#145C43" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>மாதாந்திர வருகை விவரம்</Text>
              <Text style={styles.menuSub}>Monthly attendance history & percentage</Text>
            </View>
            <ChevronRight size={16} color="#98A2B3" />
          </Pressable>
        </View>

        {/* 4. Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out of staff portal"
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          <LogOut size={18} color="#B42318" />
          <Text style={styles.signOutText}>வெளியேறு (Sign Out)</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Nav */}
      <StaffBottomNav activeTab="more" staffId={currentStaff?.id} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  topSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD1',
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 17,
    fontWeight: '700',
    color: '#074735',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#074735',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAF9F5',
  },
  profileDetails: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameEn: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2D25',
  },
  roleBadge: {
    backgroundColor: '#FBF5E8',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E7D5AA',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#936319',
  },
  nameTa: {
    fontSize: 13,
    color: '#074735',
    fontWeight: '600',
    marginTop: 2,
  },
  desText: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 11,
    color: '#5F7068',
  },

  /* Info Card */
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2DDD1',
  },
  infoCardTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1B2D25',
    marginBottom: 10,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#074735',
  },
  infoItemVal: {
    fontSize: 11.5,
    color: '#475467',
    marginTop: 1,
  },

  /* Menu Group */
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1B2D25',
  },
  menuSub: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0ECE1',
    marginLeft: 62,
  },

  /* Sign Out */
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B42318',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#074735',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#5F7068',
    marginTop: 2,
    marginBottom: 14,
  },
  staffListContainer: {
    gap: 8,
    marginBottom: 14,
  },
  staffSelectItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2DDD1',
    backgroundColor: '#FAF9F5',
  },
  staffSelectItemActive: {
    backgroundColor: '#E8F3EB',
    borderColor: '#145C43',
  },
  staffSelectDetails: {
    flex: 1,
  },
  staffSelectNameEn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2D25',
  },
  staffSelectNameTa: {
    fontSize: 11.5,
    color: '#074735',
  },
  staffSelectDes: {
    fontSize: 10.5,
    color: '#5F7068',
  },
  modalCloseButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F4EFEA',
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475467',
  },
});
