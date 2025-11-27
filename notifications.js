import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// 設定當 App 在前台(畫面開啟中)時，收到通知要不要顯示
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // 要跳出提示視窗
    shouldPlaySound: true,   // 要有聲音
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // 1. Android 必須設定 Notification Channel，否則通知不會跳出來
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX, // 設定最高優先級
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 2. 檢查權限
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // 如果還沒取得權限，就跳窗詢問
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    // 如果使用者拒絕，就不做任何事，或者可以 console.log 紀錄
    console.log('Failed to get push token for push notification!');
    return;
  }

  return true;
}

export async function scheduleDailyNotifications() {
  // 先取消之前的排程，避免重複累積
  await Notifications.cancelAllScheduledNotificationsAsync();

  const times = [9, 14, 20]; // 9點, 14點, 20點
  
  for (const hour of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📝 每日體驗取樣",
        body: "請花 1 分鐘記錄當下的心情與環境。",
        sound: true, // 確保有聲音
      },
      trigger: {
        hour: hour,
        minute: 0,
        repeats: true, // 每天重複
      },
    });
  }
  
  console.log("已設定每日通知: 9:00, 14:00, 20:00");
}
// utils/notifications.js (只需修改最下面這個函式)

export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔔 測試背景通知",
      body: "成功！即使 App 在背景也能收到通知。",
      sound: true,
    },
    trigger: {
      seconds: 10, // ★ 修改：改成 10 秒，給你時間切換到桌面
    },
  });
  console.log("已設定 10 秒後測試通知");
}