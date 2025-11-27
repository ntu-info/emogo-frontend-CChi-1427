import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // 使用 Expo 內建的圖示庫

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007bff' }}>
      {/* 首頁 Tab 設定 */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false, // 首頁已經有自訂標題了，所以這裡隱藏預設 Header
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      
      {/* 設定頁/資料管理 Tab 設定 */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false, // Settings 頁面我們也自己做了標題
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}