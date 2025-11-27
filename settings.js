import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Alert } from "react-native";
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '../../utils/db';
import { scheduleTestNotification } from '../../utils/notifications';

export default function SettingsScreen() {
  const [logs, setLogs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const db = await openDatabase();
      const result = await db.getAllAsync('SELECT * FROM logs ORDER BY id DESC LIMIT 20');
      setLogs(result);
    } catch (error) {
      console.error("讀取資料失敗:", error);
    }
  };

  const handleTestNotification = async () => {
    Alert.alert(
      "通知測試", 
      "按下確定後，請立刻：\n\n👉 按 Home 鍵回到桌面\n\n等待 10 秒看是否會跳出通知。",
      [
        {
          text: "開始測試 (10秒後)",
          onPress: async () => {
            await scheduleTestNotification();
          }
        },
        { text: "取消", style: "cancel" }
      ]
    );
  };

  // ★ 新增：時間格式化函式 (YYYY-MM-DD HH:mm:ss)
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const exportDataAsCSV = async () => {
    try {
      const db = await openDatabase();
      const allRows = await db.getAllAsync('SELECT * FROM logs ORDER BY id ASC');

      if (allRows.length === 0) {
        Alert.alert("無資料", "目前沒有紀錄可供匯出。");
        return;
      }

      // ★ 修正：加入 BOM (\uFEFF) 並更新標題與內容格式
      let csvContent = "\uFEFFID,時間,心情分數,緯度,經度,影片路徑\n";

      allRows.forEach((row) => {
        const timeStr = formatTime(row.timestamp); // 使用格式化時間
        const lat = row.latitude || "";
        const lng = row.longitude || "";
        const video = row.video_uri || "";
        csvContent += `${row.id},${timeStr},${row.sentiment},${lat},${lng},${video}\n`;
      });

      const fileName = 'esm_data_export.csv';
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: '匯出體驗取樣資料',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert("錯誤", "您的裝置不支援分享功能");
      }

    } catch (error) {
      console.error("匯出失敗詳細錯誤:", error);
      Alert.alert("匯出失敗", error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.logItem}>
      {/* 這裡也順便套用好看的時間格式 */}
      <Text style={styles.logText}>📅 {formatTime(item.timestamp)}</Text>
      <Text style={styles.logText}>😊 心情: {item.sentiment}</Text>
      <Text style={styles.subText}>📍 {item.latitude ? "有座標" : "無座標"} | 📹 {item.video_uri ? "有影片" : "無影片"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>資料管理</Text>

      <View style={styles.buttonContainer}>
        <Button title="🔔 測試背景通知 (10秒後)" onPress={handleTestNotification} color="#28a745" />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="匯出所有資料 (.csv)" onPress={exportDataAsCSV} color="#007bff" />
      </View>
      <Text style={styles.hint}>* CSV 檔案可用 Excel 開啟</Text>

      <Text style={styles.subtitle}>最近紀錄預覽：</Text>
      
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>目前沒有資料</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// Styles 保持不變
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', marginTop: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  buttonContainer: { marginBottom: 10 },
  hint: { textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 10 },
  logItem: { padding: 15, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee', borderRadius: 8, marginBottom: 10 },
  logText: { fontSize: 16, marginBottom: 4, color: '#333' },
  subText: { fontSize: 14, color: '#666' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  listContent: { paddingBottom: 20 }
});