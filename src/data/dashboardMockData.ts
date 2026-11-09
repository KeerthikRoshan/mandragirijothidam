/**
 * Static Mock Data & Helpers for Mandhragiri Jothidam Dashboard Screen
 * Matches the updated official design reference screenshot.
 */

import {
  PanchangamData,
  OverviewStatItem,
  LiveOperationData,
  EventBookingItem,
  DashboardBottomTabId,
} from '../types/dashboard';
import { ASSETS } from '../constants/assets';

/**
 * Returns dynamic Tamil date string:
 * e.g. "Wednesday, 14 Oct 2026 • புரட்டாசி 28 (புதன்)"
 */
export function getTamilCalendarString(date: Date = new Date()): string {
  const gregorianDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const gregorianMonths = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const tamilDays = [
    'ஞாயிறு',
    'திங்கள்',
    'செவ்வாய்',
    'புதன்',
    'வியாழன்',
    'வெள்ளி',
    'சனி',
  ];

  // Approximate Tamil Month calculation based on solar calendar transition (~14th of each month)
  const tamilMonths = [
    'தை', // Jan
    'மாசி', // Feb
    'பங்குனி', // Mar
    'சித்திரை', // Apr
    'வைகாசி', // May
    'ஆனி', // Jun
    'ஆடி', // Jul
    'ஆவணி', // Aug
    'புரட்டாசி', // Sep
    'ஐப்பசி', // Oct
    'கார்த்திகை', // Nov
    'மார்கழி', // Dec
  ];

  const dayOfWeek = gregorianDays[date.getDay()];
  const dayOfMonth = date.getDate();
  const monthName = gregorianMonths[date.getMonth()];
  const year = date.getFullYear();

  // Solar month determination
  const mIndex = date.getMonth();
  const tMonth = dayOfMonth >= 14 ? tamilMonths[mIndex] : tamilMonths[(mIndex + 11) % 12];
  const tDay = dayOfMonth >= 14 ? dayOfMonth - 13 : dayOfMonth + 16;
  const tDayOfWeek = tamilDays[date.getDay()];

  return `${dayOfWeek}, ${dayOfMonth} ${monthName} ${year} • ${tMonth} ${tDay} (${tDayOfWeek})`;
}

export const DASHBOARD_MOCK_DATA = {
  header: {
    brandTitle: 'மந்திரகிரி ஜோதிடம்',
    notificationCount: 3,
  },
  welcome: {
    dashboardLabel: 'Home Dashboard',
    greeting: 'வணக்கம், நிர்வாகி',
  },
  panchangam: {
    titleTamil: 'இன்றைய\nபஞ்சாங்கம்',
    gregorianDateBadge: '12 Oct 2026 •',
    tamilDateBadge: 'புரட்டாசி 26',
    cards: [
      {
        id: 'p-tithi',
        category: 'திதி • TITHI',
        title: 'சுக்கில துவாதசி',
        subtitle: 'Dwadashi (பகல் 02:44 வரை)',
        iconType: 'lotus',
      },
      {
        id: 'p-star',
        category: 'நட்சத்திரம் • STAR',
        title: 'உத்திரம்',
        subtitle: 'Uthiram (மாலை 04:12 வரை)',
        iconType: 'moon',
      },
      {
        id: 'p-nalla-neram',
        category: 'நல்ல நேரம்',
        title: '09:15 – 10:15',
        subtitle: 'காலை(மாலை 04:45–05:45)',
        badgeText: 'சுபம்',
        badgeType: 'success',
        iconType: 'time',
      },
      {
        id: 'p-rahu-kalam',
        category: 'ராகு காலம்',
        title: '07:30 – 09:00',
        subtitle: 'காலை வேளை',
        badgeText: 'விலக்குக',
        badgeType: 'danger',
        iconType: 'alert',
      },
    ],
    actionText: 'முழு பஞ்சாங்கம் காண்க • View Full Panchangam',
  } as PanchangamData,
  overview: {
    title: 'இன்றைய நிலை',
    actionText: 'அறிக்கைகள் ›',
    stats: [
      {
        id: 'stat-today',
        title: 'இன்றைய நிகழ்வுகள்',
        value: '08',
        subtitle: 'நிகழ்வு',
        image: ASSETS.images.dashboard.todaysEvents,
        valueColor: '#064E3B',
      },
      {
        id: 'stat-upcoming',
        title: 'வரவிருப்பவை',
        value: '24',
        subtitle: 'அடுத்த 7 நாள்',
        image: ASSETS.images.dashboard.upcoming,
        valueColor: '#064E3B',
      },
      {
        id: 'stat-financial',
        title: 'நிதி தணிக்கைகள்',
        value: '₹ 15K',
        subtitle: 'கட்டண தீர்வு',
        image: ASSETS.images.dashboard.pendingApproval,
        valueColor: '#B08D43',
      },
      {
        id: 'stat-completed',
        title: 'நிறைவடைந்தவை',
        value: '142',
        subtitle: 'மொத்தம்',
        image: ASSETS.images.dashboard.completed,
        valueColor: '#064E3B',
      },
    ] as OverviewStatItem[],
  },
  todayEvents: {
    title: 'இன்றைய நிகழ்வுகள்',
    count: 8,
    actionText: 'காண்க',
    liveOperation: {
      time: '08:30 AM',
      title: '08:30 AM கணபதி ஹோமம்',
      subtitle: 'அண்ணா நகர் மேற்கு • குருக்கள்:',
      location: 'அண்ணா நகர் மேற்கு',
      priestName: 'குருக்கள்',
    } as LiveOperationData,
    bookings: [
      {
        id: 'event-1',
        timeRange: '09:00 AM – 09:30 AM',
        category: 'ஜாதகம்',
        categoryBg: '#E2ECE7',
        categoryTextColor: '#074735',
        iconType: 'book',
        iconBg: '#F1F5F3',
        iconColor: '#426658',
        titleTamil: 'ஜாதக கணிப்பு',
        titleEnglish: 'Consultation',
        customerName: 'Ramesh',
        adminOrPriestInfo: 'நிர்வாகி (Admin)',
        status: 'உறுதியானது',
      },
      {
        id: 'event-2',
        timeRange: '10:30 AM – 12:00 PM',
        category: 'வெளியூர்',
        categoryBg: '#FEF3C7',
        categoryTextColor: '#92400E',
        iconType: 'heart',
        iconBg: '#FFF4E6',
        iconColor: '#B87B28',
        titleTamil: 'திருமண பூஜை',
        titleEnglish: 'Marriage Pooja',
        customerName: 'Senthil',
        location: 'திருவண்ணாமலை',
        adminOrPriestInfo: 'அர்ச்சகர்: முருகன் சிவாச்சாரியார்',
        isPriestRow: true,
        status: 'உறுதியானது',
      },
    ] as EventBookingItem[],
  },
  fab: {
    title: '+ பூஜை பதிவு',
    subtext: '(New)',
  },
  bottomNavTabs: [
    { id: 'home' as DashboardBottomTabId, label: 'முகப்பு', isSelected: true },
    { id: 'date' as DashboardBottomTabId, label: 'நாள்வாரி', isSelected: false },
    { id: 'priest' as DashboardBottomTabId, label: 'புரோகிதர்', isSelected: false },
    { id: 'profile' as DashboardBottomTabId, label: 'profile', isSelected: false },
  ],
};
