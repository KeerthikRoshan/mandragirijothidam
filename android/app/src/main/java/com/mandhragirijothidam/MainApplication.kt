package com.mandhragirijothidam

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannels()
    loadReactNative(this)
  }

  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

      // 1. Default Notification Channel
      val defaultChannel = NotificationChannel(
        "mandhiragiri_default_channel",
        "Mandhiragiri Notifications",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "General pooja booking alerts, assignments and announcements"
        enableLights(true)
        enableVibration(true)
      }

      // 2. High-Importance 5-Minute Reminder Channel
      val reminderChannel = NotificationChannel(
        "mandhiragiri_reminder_channel",
        "Mandhiragiri Booking Reminders",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Urgent 5-minute and time-based pooja reminders"
        enableLights(true)
        enableVibration(true)
      }

      notificationManager?.createNotificationChannel(defaultChannel)
      notificationManager?.createNotificationChannel(reminderChannel)
    }
  }
}
