import { useEffect } from 'react'; // 移除 useState, View, Text, StyleSheet
import { Alert } from 'react-native';
import * as Location from 'expo-location';

export default function LocationTracker({ onLocationUpdated }) {
  // 不需要 displayMsg 了，因為不顯示在畫面上

  useEffect(() => {
    (async () => {
      // 請求權限
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // 雖然不顯示座標，但如果沒權限還是建議告知使用者，或選擇默默失敗
        // Alert.alert("注意", "拒絕定位權限，將無法記錄位置資訊");
        onLocationUpdated(null);
        return;
      }

      try {
        // 取得位置
        let loc = await Location.getCurrentPositionAsync({});
        // 回傳位置物件給父層 (主畫面)
        onLocationUpdated(loc);
        console.log("Location fetched:", loc.coords); // 為了開發方便，我們印在 console 就好
      } catch (error) {
        console.log("無法取得位置:", error);
        onLocationUpdated(null); // 失敗時回傳 null
      }
    })();
  }, []);

  // 這裡回傳 null，讓這個元件在畫面上完全不佔空間
  return null;
}