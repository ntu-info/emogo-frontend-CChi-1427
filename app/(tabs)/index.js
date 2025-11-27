import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library'; // ★ 新增：媒體庫
import { insertLog } from '../../utils/db';
import { registerForPushNotificationsAsync, scheduleDailyNotifications } from '../../utils/notifications';

import SentimentSection from '../../components/SentimentSection';
import VlogRecorder from '../../components/VlogRecorder';
import LocationTracker from '../../components/LocationTracker';

export default function HomeScreen() {
  const [sentiment, setSentiment] = useState(2);
  const [videoUri, setVideoUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions(); // ★ 媒體庫權限

  useEffect(() => {
    registerForPushNotificationsAsync();
    scheduleDailyNotifications();
  }, []);

  const handleSave = async () => {
    if (sentiment === null || sentiment === undefined) {
      Alert.alert("資料不完整", "請確認心情分數");
      return;
    }

    // 檢查並請求媒體庫權限
    if (!mediaPermission?.granted) {
      const permission = await requestMediaPermission();
      if (!permission.granted) {
        Alert.alert("權限不足", "需要媒體庫權限才能儲存影片");
        return;
      }
    }
    
    try {
      let finalVideoUri = null;

      if (videoUri) {
        // --- 動作 1: 存到手機相簿 (讓使用者看得到) ---
        try {
          const asset = await MediaLibrary.createAssetAsync(videoUri);
          // 可以在相簿建立一個專屬相簿，這裡先直接存入預設相簿
          await MediaLibrary.createAlbumAsync('ExperienceSampling', asset, false);
          console.log("影片已存入相簿");
        } catch (mediaErr) {
          console.log("存入相簿失敗:", mediaErr);
          // 不阻擋流程，繼續執行內部儲存
        }

        // --- 動作 2: 移動到 App 文件區 (讓 App 資料庫連結有效) ---
        const fileName = `vlog_${Date.now()}.mp4`;
        const newPath = FileSystem.documentDirectory + fileName;
        
        await FileSystem.moveAsync({
          from: videoUri,
          to: newPath
        });
        
        finalVideoUri = newPath;
        console.log("影片已移動至永久路徑:", newPath);
      }

      // 儲存資料庫紀錄
      await insertLog(sentiment, finalVideoUri, location);
      
      Alert.alert("成功", "✅ 資料已儲存！\n影片已存入手機相簿。");
      
      // 重置表單
      setSentiment(2);
      setVideoUri(null); 
    } catch (e) {
      console.error(e);
      Alert.alert("錯誤", "儲存失敗: " + e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>每日體驗取樣</Text>

      <SentimentSection 
        value={sentiment} 
        onValueChange={setSentiment} 
      />

      <VlogRecorder 
        onVideoRecorded={(uri) => setVideoUri(uri)} 
        currentUri={videoUri} 
      />

      <LocationTracker 
        onLocationUpdated={(loc) => setLocation(loc)} 
      />

      <View style={styles.buttonContainer}>
        <Button title="提交紀錄" onPress={handleSave} size="lg" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    padding: 20, 
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    textAlign: 'center',
    color: '#333'
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40
  }
});