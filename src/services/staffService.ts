/**
 * Staff Management Service for Mandhragiri Jothidam (மந்திரகிரி ஜோதிடம்)
 *
 * Provides a unified in-memory reactive store for all created priests and assistants:
 * - Dynamic retrieval of all, active, and inactive staff
 * - Activation and deactivation controls for admin
 * - Staff deletion (remove/fire) with subscriber notifications
 * - Addition of newly created priests/assistants with admin-assigned passwords
 */

import { PriestStaffItem, PriestStatus } from '../types/priest';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

export interface CreateStaffRequest {
  name_english: string;
  name_tamil: string;
  staff_role: string;
  designation: string;
  phone: string;
  password: string;
  tradition?: string;
  expertise?: string;
  certification?: string;
  languages_spoken?: string;
  avatar_url?: string | null;
  email?: string;

  // camelCase alternatives supported by backend
  nameEnglish?: string;
  nameTamil?: string;
  staffRole?: string;
  languagesSpoken?: string;
  avatarUrl?: string | null;
}

export interface CreateStaffResult {
  success: boolean;
  data?: PriestStaffItem;
  message?: string;
  errors?: any;
  isOfflineFallback?: boolean;
}

class StaffService {
  private staffList: PriestStaffItem[] = [];
  private listeners: Array<() => void> = [];
  private lastActionTimestamp = 0;

  /**
   * Returns a copy of all loaded priests and assistants
   */
  getAllStaff(): PriestStaffItem[] {
    return [...this.staffList];
  }

  /**
   * Returns all active staff
   */
  getActiveStaff(): PriestStaffItem[] {
    return this.staffList.filter(s => s.status === 'active');
  }

  /**
   * Returns all inactive staff
   */
  getInactiveStaff(): PriestStaffItem[] {
    return this.staffList.filter(s => s.status === 'inactive');
  }

  /**
   * Find staff member by ID
   */
  getStaffById(id: string): PriestStaffItem | undefined {
    return this.staffList.find(s => s.id === id || s.staffId === id);
  }

  /**
   * Fetch staff directory from backend database: GET /api/v1/staff
   * Strict database values only; no sample/mock data injected.
   */
  async fetchStaff(params?: { status?: string; search?: string }): Promise<PriestStaffItem[]> {
    const fetchStartTime = Date.now();
    try {
      console.log('📡 [staffService] GET /api/v1/staff request:', params);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STAFF.LIST, { params });
      console.log('📥 [staffService] GET /api/v1/staff response status:', response.status);

      const resBody = response.data;
      let rawList: any[] = [];

      if (Array.isArray(resBody?.data?.staff)) {
        rawList = resBody.data.staff;
      } else if (Array.isArray(resBody?.data?.rows)) {
        rawList = resBody.data.rows;
      } else if (Array.isArray(resBody?.data)) {
        rawList = resBody.data;
      } else if (Array.isArray(resBody?.staff)) {
        rawList = resBody.staff;
      } else if (Array.isArray(resBody)) {
        rawList = resBody;
      }

      // Prevent stale GET responses from overwriting newer UI updates
      if (this.lastActionTimestamp > fetchStartTime) {
        console.log('⚠️ [staffService] Newer action occurred while GET was in flight. Skipping stale update.');
        return [...this.staffList];
      }

      const mappedStaff = rawList.map(item => this.mapBackendStaffRecord(item));
      this.staffList = mappedStaff;
      this.notify();
      return mappedStaff;
    } catch (err: any) {
      console.error('❌ [staffService] GET /api/v1/staff failed:', err.message);
      return [...this.staffList];
    }
  }

  /**
   * Add or update a staff member in the in-memory cache
   */
  addStaff(newStaff: PriestStaffItem): void {
    const listIndex = this.staffList.findIndex(
      s => s.id === newStaff.id || (s.staffId && s.staffId === newStaff.staffId)
    );
    if (listIndex === -1) {
      this.staffList = [newStaff, ...this.staffList];
    } else {
      this.staffList[listIndex] = newStaff;
    }
    this.notify();
  }

  /**
   * Reset / clear staff list
   */
  clear(): void {
    this.staffList = [];
    this.notify();
  }

  /**
   * Create a new staff member via Admin API: POST /api/v1/createStaff
   */
  async createStaff(payload: CreateStaffRequest): Promise<CreateStaffResult> {
    try {
      console.log('📡 [staffService] POST /api/v1/createStaff request:', payload);
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.STAFF.CREATE, payload);
      console.log('📥 [staffService] POST /api/v1/createStaff response status:', response.status);
      const resBody = response.data;

      const isSuccess =
        response.status === 201 ||
        response.status === 200 ||
        resBody?.success === true ||
        resBody?.status === 1;

      if (isSuccess && (resBody?.data || resBody)) {
        const backendData = resBody.data || resBody;
        const staffItem = this.mapBackendStaffRecord(backendData, payload);
        staffItem.password = payload.password;
        this.addStaff(staffItem);

        return {
          success: true,
          data: staffItem,
          message: resBody?.message || 'புரோகிதர் வெற்றிகரமாக சேர்க்கப்பட்டார்.',
        };
      }

      const failureMessage =
        resBody?.message ||
        (typeof resBody?.errors === 'string'
          ? resBody.errors
          : resBody?.errors && typeof resBody.errors === 'object'
            ? Object.values(resBody.errors)[0]
            : null) ||
        'புரோகிதர் சேர்க்க முடியவில்லை.';

      return {
        success: false,
        message: String(failureMessage),
        errors: resBody?.errors,
      };
    } catch (apiError: any) {
      if (apiError?.response) {
        let errorData = apiError.response.data;
        if (typeof errorData === 'string') {
          try {
            errorData = JSON.parse(errorData);
          } catch (_e) {}
        }

        const apiMessage =
          (typeof errorData === 'object' && errorData !== null
            ? errorData.message ||
              (typeof errorData.errors === 'string'
                ? errorData.errors
                : errorData.errors && typeof errorData.errors === 'object'
                  ? Object.values(errorData.errors)[0]
                  : null) ||
              errorData.error
            : typeof errorData === 'string'
              ? errorData
              : null) ||
          (apiError.response.status === 409
            ? 'இந்த கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (Mobile number already registered).'
            : apiError.response.status === 401 || apiError.response.status === 403
              ? 'அங்கீகரிக்கப்படாத செயல்பாடு (Unauthorized: Admin token required).'
              : 'புரோகிதர் சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');

        return {
          success: false,
          message: typeof apiMessage === 'string' ? apiMessage : String(apiMessage),
          errors: errorData?.errors || null,
        };
      }

      return {
        success: false,
        message:
          apiError?.message ||
          'பிணையப் பிழை. சேவையகத்தை இணைக்க முடியவில்லை (Network error: Unable to reach backend).',
        errors: apiError,
      };
    }
  }

  /**
   * Pure mapping from database record to PriestStaffItem.
   * Uses only database values with zero hardcoded sample showcase values.
   */
  mapBackendStaffRecord(data: any, fallbackPayload?: CreateStaffRequest): PriestStaffItem {
    const rawId =
      data?.staffId ?? data?.id ?? data?._id ?? fallbackPayload?.phone ?? `p-${Date.now()}`;
    const id = String(rawId);
    const staffId = data?.staffId ? String(data.staffId) : id;
    const nameEn =
      data?.nameEnglish ||
      data?.name_english ||
      data?.name ||
      fallbackPayload?.name_english ||
      fallbackPayload?.nameEnglish ||
      '';
    const nameTa =
      data?.nameTamil ||
      data?.name_tamil ||
      fallbackPayload?.name_tamil ||
      fallbackPayload?.nameTamil ||
      nameEn ||
      '';
    const roleClean =
      data?.staffRole ||
      data?.staff_role ||
      data?.role ||
      fallbackPayload?.staff_role ||
      fallbackPayload?.staffRole ||
      'Priest';
    const roleBadge =
      data?.roleBadge ||
      data?.role_badge ||
      (data?.staffRole || data?.staff_role || data?.role || roleClean).toUpperCase();
    const designation =
      data?.designationTamil ||
      data?.designation_tamil ||
      data?.designation ||
      fallbackPayload?.designation ||
      '';
    const designationEn =
      data?.designationEnglish ||
      data?.designation_english ||
      data?.designation ||
      fallbackPayload?.designation ||
      designation;
    const fullTitleTa =
      data?.fullTitleTamil ||
      data?.full_title_tamil ||
      (designation ? `${nameTa} - ${designation}` : nameTa);
    const traditionTa =
      data?.traditionTamil ||
      data?.tradition_tamil ||
      data?.tradition ||
      fallbackPayload?.tradition ||
      '';
    const traditionEn =
      data?.traditionEnglish ||
      data?.tradition_english ||
      '';
    const certificationTa =
      data?.certificationTamil ||
      data?.certification_tamil ||
      data?.certification ||
      fallbackPayload?.certification ||
      '';
    const certificationEn =
      data?.certificationEnglish ||
      data?.certification_english ||
      '';
    const phone =
      data?.phone ||
      data?.phone_number ||
      data?.mobileNumber ||
      data?.mobile_number ||
      fallbackPayload?.phone ||
      '';
    const phoneDisplay =
      data?.phoneDisplay ||
      data?.phone_display ||
      (phone.length > 6 ? `${phone.slice(0, 6)} XXXXX` : phone);
    const expertiseTa =
      data?.expertiseTamil ||
      data?.expertise_tamil ||
      data?.expertise ||
      fallbackPayload?.expertise ||
      '';
    const languagesTa =
      data?.languagesTamil ||
      data?.languages_tamil ||
      data?.languagesSpoken ||
      data?.languages_spoken ||
      fallbackPayload?.languages_spoken ||
      fallbackPayload?.languagesSpoken ||
      '';
    const avatarUrl =
      data?.avatarUrl ||
      data?.avatar_url ||
      fallbackPayload?.avatar_url ||
      fallbackPayload?.avatarUrl ||
      (typeof data?.avatar === 'string' ? data.avatar : null);
    const status =
      String(data?.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    const bookings = Array.isArray(data?.bookings) ? data.bookings : [];

    const totalBookings = data?.metrics?.totalBookings ?? data?.stats?.total ?? bookings.length;
    const thisWeekBookings = data?.metrics?.thisWeekBookings ?? data?.stats?.thisWeek ?? 0;
    const conflictsCount = data?.metrics?.conflictsCount ?? data?.stats?.conflicts ?? 0;

    const tabCounts = data?.tabCounts || {
      past: data?.metrics?.pastBookings ?? 0,
      active: data?.metrics?.activeBookings ?? 0,
      upcoming: data?.metrics?.upcomingBookings ?? 0,
    };

    return {
      id,
      staffId,
      nameEnglish: nameEn,
      nameTamil: nameTa,
      role: roleClean,
      roleBadge,
      designationTamil: designation,
      designationEnglish: designationEn,
      fullTitleTamil: fullTitleTa,
      traditionTamil: traditionTa,
      traditionEnglish: traditionEn,
      certificationTamil: certificationTa,
      certificationEnglish: certificationEn,
      phone,
      phoneDisplay,
      expertiseTamil: expertiseTa,
      languagesTamil: languagesTa,
      avatar: avatarUrl
        ? { uri: avatarUrl }
        : data?.avatar && typeof data.avatar === 'object'
          ? data.avatar
          : null,
      status: status as PriestStatus,
      bookings,
      stats: {
        total: totalBookings,
        thisWeek: thisWeekBookings,
        conflicts: conflictsCount,
      },
      tabCounts,
      scheduledPoojasCount: tabCounts.active || 0,
      email: data?.email || fallbackPayload?.email,
      password: data?.password || fallbackPayload?.password,
    };
  }

  // Alias for backward-compatibility if anything calls mapBackendStaffToItem
  mapBackendStaffToItem(data: any, payload: CreateStaffRequest): PriestStaffItem {
    return this.mapBackendStaffRecord(data, payload);
  }

  /**
   * Update staff record (Activate, Deactivate, or Soft Delete) via Admin API: PUT /api/v1/staff/:id
   */
  async updateStaffApi(
    id: string,
    payload: {
      status?: 'Active' | 'Inactive' | string;
      isDeleted?: boolean;
      staff?: any;
      [key: string]: any;
    }
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    this.lastActionTimestamp = Date.now();
    try {
      console.log(`📡 [staffService] PUT /api/v1/staff/${id} request:`, payload);
      const url = `${API_CONFIG.ENDPOINTS.STAFF.LIST}/${encodeURIComponent(id)}`;
      const response = await apiClient.put(url, payload);
      console.log(`📥 [staffService] PUT /api/v1/staff/${id} response status:`, response.status);

      const resBody = response.data;
      const isSuccess =
        response.status === 200 ||
        response.status === 201 ||
        response.status === 204 ||
        resBody?.success === true ||
        resBody?.status === 1;

      if (isSuccess) {
        this.lastActionTimestamp = Date.now();
        if (payload.isDeleted) {
          this.deleteStaff(id);
        } else if (payload.status) {
          const lowerStatus =
            String(payload.status).toLowerCase() === 'active' ? 'active' : 'inactive';
          this.updateStaffStatus(id, lowerStatus as PriestStatus);
        }
        return {
          success: true,
          data: resBody?.data || resBody,
          message: resBody?.message || 'பணியாளர் விவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.',
        };
      }

      return {
        success: false,
        message: resBody?.message || 'பணியாளர் விவரத்தை புதுப்பிக்க முடியவில்லை.',
      };
    } catch (err: any) {
      console.error(
        `❌ [staffService] PUT /api/v1/staff/${id} failed:`,
        err?.response?.data || err.message
      );
      const errorData = err?.response?.data;
      let errorMsg = errorData?.message || errorData?.error;
      if (err?.response?.status === 409) {
        errorMsg =
          'இந்த கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (Mobile number already registered).';
      } else if (!errorMsg) {
        errorMsg = err.message || 'செயல்பாட்டை முடிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.';
      }
      return {
        success: false,
        message: typeof errorMsg === 'string' ? errorMsg : String(errorMsg),
      };
    }
  }

  /**
   * Set staff status to 'active' or 'inactive'
   */
  updateStaffStatus(id: string, status: PriestStatus): boolean {
    const staff = this.staffList.find(s => s.id === id || s.staffId === id);
    if (staff) {
      staff.status = status;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Permanently delete / remove (fire) a staff member
   */
  deleteStaff(id: string): boolean {
    const prevCount = this.staffList.length;
    this.staffList = this.staffList.filter(s => s.id !== id && s.staffId !== id);
    if (this.staffList.length !== prevCount) {
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Subscribe to staff list changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (_e) {
        // Ignore subscriber errors
      }
    });
  }
}

export const staffService = new StaffService();
