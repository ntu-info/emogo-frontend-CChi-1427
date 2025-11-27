import { useState, useRef, useEffect } from 'react';
import { View, Button, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function VlogRecorder({ onVideoRecorded, currentUri }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [cameraKey, setCameraKey] = useState(1);
  const cameraRef = useRef(null);

  // ★ 關鍵修正：當父層清空資料 (提交後) 或按下重錄時，強制刷新相機
  useEffect(() => {
    if (!currentUri) {
      setHasRecorded(false);
      setIsRecording(false);
      // 強制刷新相機元件，避免前一次錄影的狀態卡住
      setCameraKey(prev => prev + 1);
    }
  }, [currentUri]);

  if (!cameraPermission || !micPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>需要相機與麥克風權限</Text>
        <Button 
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }} 
          title="授權權限" 
        />
      </View>
    );
  }

  const recordVlog = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 2 }); // 錄製 2 秒
        setHasRecorded(true);
        onVideoRecorded(video.uri);
      } catch (e) {
        console.error(e);
        Alert.alert("錄影失敗", "請重試");
        setCameraKey(prev => prev + 1); // 失敗也刷新
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handleRetake = () => {
    setCameraKey(prev => prev + 1); // 刷新相機
    setHasRecorded(false);
    setIsRecording(false);
    onVideoRecorded(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>2. 拍攝 Vlog:</Text>

      {hasRecorded ? (
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
        // ★ 修正畫面比例：改用 aspectRatio 讓預覽畫面完整呈現 (WYSIWYG)
        <View style={styles.cameraWrapper}>
          <CameraView 
            key={cameraKey}
            style={styles.camera} 
            ref={cameraRef}
            mode="video"
            facing="front"
          />
          <View style={styles.overlay}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingBtn]}
              onPress={recordVlog}
              disabled={isRecording}
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
  
  // ★ 修改：相機容器改為 3:4 比例，符合大多數手機前鏡頭
  cameraWrapper: { 
    width: '100%',
    aspectRatio: 3 / 4, // 讓高度自動根據寬度計算，保持 3:4
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#000',
    position: 'relative',
    elevation: 3,
    alignSelf: 'center', // 置中
  },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  
  // 按鈕樣式
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

  // 結果顯示容器
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