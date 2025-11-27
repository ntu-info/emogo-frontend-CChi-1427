import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// 設定當 App 在前台時，收到通知的行為
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  return true;
}

export async function scheduleDailyNotifications() {
  // 取消舊的排程，避免重複
  await Notifications.cancelAllScheduledNotificationsAsync();

  const times = [9, 14, 20]; // 每天 9:00, 14:00, 20:00
  
  for (const hour of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📝 每日體驗取樣",
        body: "請花 1 分鐘記錄當下的心情與環境。",
        sound: true,
      },
      trigger: {
        hour: hour,
        minute: 0,
        repeats: true,
      },
    });
  }
  
  console.log("已設定每日定時通知 (9, 14, 20點)");
}