/**
 * Centralized Asset Registry for Mandhragiri Jothidam
 *
 * Keeps media assets replaceable without modifying component logic.
 */

export const ASSETS = {
  videos: {
    splash: require('../assets/videos/splash.mp4'),
  },
  images: {
    logo: require('../assets/images/logo.png'),
    headerLogo: require('../assets/images/logo.png'),
    bootsplashLogo: require('../assets/images/bootsplash_logo.png'),
    dashboard: {
      todaysEvents: require('../assets/images/dashboard/todays_events.png'),
      upcoming: require('../assets/images/dashboard/upcoming.png'),
      pendingApproval: require('../assets/images/dashboard/pending_approval.png'),
      completed: require('../assets/images/dashboard/completed.png'),
    },
    schedule: {
      emptyCalendar: require('../assets/images/schedule/empty_calendar.png'),
    },
    priests: {
      murugan: require('../assets/images/priests/murugan.png'),
      shastriji: require('../assets/images/priests/shastriji.png'),
      ramu: require('../assets/images/priests/ramu.png'),
      sundaram: require('../assets/images/priests/sundaram.png'),
      venkat: require('../assets/images/priests/venkat.png'),
    },
  },
} as const;

