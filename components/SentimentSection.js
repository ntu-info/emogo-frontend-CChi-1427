// components/SentimentSection.js
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function SentimentSection({ value, onValueChange }) {
  return (
    <View style={styles.section}>
      {/* 顯示目前的數值 */}
      <Text style={styles.label}>1. 心情分數: {value}</Text>
      
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={4}
        step={1}                // 設定步進值為 1，確保只會選到整數
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#1FB28A" // 滑過的部分顏色 (綠色)
        maximumTrackTintColor="#d3d3d3" // 未滑過的部分顏色 (灰色)
        thumbTintColor="#1FB28A"        // 按鈕顏色
      />
      
      {/* 顯示滑桿兩端的文字說明 */}
      <View style={styles.textRow}>
        <Text style={styles.helperText}>非常不好 (0)</Text>
        <Text style={styles.helperText}>非常好 (4)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { 
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa', // 加一點底色讓區塊更明顯
    borderRadius: 12,
  },
  label: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10,
    textAlign: 'center' // 讓標題置中
  },
  slider: {
    width: '100%',
    height: 40,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
  },
});