import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router'; // ★ 新增：偵測頁面是否聚焦

export default function VlogRecorder({ onVideoRecorded, currentUri }) {
  const isFocused = useIsFocused(); // 確保離開頁面時釋放相機
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isReloading, setIsReloading] = useState(false); // ★ 新增：控制重啟的緩衝狀態
  const cameraRef = useRef(null);

  // 監聽父層狀態，如果父層清空了資料 (提交後)，執行重置流程
  useEffect(() => {
    if (!currentUri && hasRecorded) {
      performReset();
    }
  }, [currentUri]);

  // ★ 關鍵函式：執行帶有緩衝的重置
  const performReset = () => {
    setHasRecorded(false);
    setIsRecording(false);
    setIsReloading(true); // 1. 先標記為重整中 (這會讓 CameraView 消失)
    
    // 2. 給予 200ms 的冷卻時間，讓硬體資源釋放
    setTimeout(() => {
      setIsReloading(false); // 3. 重新顯示 CameraView
    }, 200);
  };

  // 處理權限
  if (!cameraPermission || !micPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>需要相機與麥克風權限</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }} 
        >
          <Text style={styles.permissionButtonText}>授權權限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recordVlog = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 2 });
        setHasRecorded(true);
        onVideoRecorded(video.uri);
      } catch (e) {
        console.error(e);
        Alert.alert("錄影失敗", "請重試");
        performReset(); // 失敗時也執行緩衝重啟
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handleRetake = () => {
    onVideoRecorded(null);
    performReset(); // ★ 點擊重錄時，執行緩衝重啟
  };

  // ★ 決定是否渲染相機：
  // 1. 必須有焦點 (isFocused)
  // 2. 還沒錄好 (!hasRecorded)
  // 3. 不是在重整冷卻中 (!isReloading)
  // 4. App 狀態正常 (AppState 可以進階處理，但通常 isFocused 就夠了)
  const shouldShowCamera = isFocused && !hasRecorded && !isReloading;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>2. 拍攝 Vlog:</Text>

      {hasRecorded ? (
        // === 錄製完成介面 ===
        <View style={styles.resultContainer}>
          <View style={styles.resultContent}>
            <Ionicons name="checkmark-circle" size={48} color="#28a745" />
            <Text style={styles.resultText}>影片已錄製</Text>
          </View>
          <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
            <Ionicons name="refresh" size={20} color="#666" style={{marginRight: 5}}/>
            <Text style={styles.retakeText}>重新錄製</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // === 相機介面 ===
        <View style={styles.cameraWrapper}>
          {shouldShowCamera ? (
            <CameraView 
              style={styles.camera} 
              ref={cameraRef}
              mode="video"
              facing="front"
            />
          ) : (
            // 當相機正在重啟或不可用時，顯示一個黑底或載入中
            <View style={styles.cameraPlaceholder}>
                <Text style={{color: '#666'}}>相機準備中...</Text>
            </View>
          )}

          {/* 按鈕層：即使相機正在載入，按鈕也可以顯示(但 disable) */}
          <View style={styles.overlay}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingBtn]}
              onPress={recordVlog}
              disabled={isRecording || !shouldShowCamera} // 相機沒出來前不能按
            >
              {isRecording ? (
                <View style={styles.recordingIndicator} />
              ) : (
                <Ionicons name="videocam" size={24} color="white" />
              )}
              <Text style={styles.recordButtonText}>
                {isRecording ? " 錄影中..." : " 錄製 (2秒)"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  permissionText: { marginBottom: 10, textAlign: 'center', color: '#666' },
  permissionButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center' },
  permissionButtonText: { color: 'white' },

  cameraWrapper: { 
    width: '100%',
    aspectRatio: 3 / 4, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#000',
    position: 'relative',
    elevation: 3,
    alignSelf: 'center',
  },
  camera: { flex: 1 },
  // 新增：相機重啟時的佔位區塊
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 5,
  },
  recordingBtn: {
    backgroundColor: '#dc3545',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },

  resultContainer: {
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28a745',
    paddingVertical: 15,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginLeft: 10,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  retakeText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});