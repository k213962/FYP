import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import Voice from '@react-native-voice/voice'; // Voice recognition
import { Audio } from 'expo-av'; // Microphone permission

// Import images
import sendIcon from '../../assets/send.png';
import voiceIcon from '../../assets/voice.png';
import stopIcon from '../../assets/stop.png';

export default function ChatBotScreen() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hello! I'm here to help. How can I assist you today?", isUser: false },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Request microphone permission
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Permission Error:', error);
    }
  };

  // Start & Stop Recording
  const handleStartRecording = async () => {
    if (hasPermission && !isRecording) {
      try {
        await Voice.start('en-US');
        setIsRecording(true);
      } catch (error) {
        console.error('Voice Start Error:', error);
      }
    } else {
      Alert.alert('Permission Required', 'Please allow microphone access.');
    }
  };

  const handleStopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Voice Stop Error:', error);
    }
  };

  // Speech Result Handling
  useEffect(() => {
    Voice.onSpeechResults = (e) => setUserInput(e.value?.[0] || '');
    Voice.onSpeechError = (e) => Alert.alert('Error', e.error.message);
    requestPermissions();
    return () => Voice.destroy().then(Voice.removeAllListeners);
  }, []);

  // Send Message
  const handleSendMessage = () => {
    if (userInput.trim()) {
      setMessages([...messages, { text: userInput, isUser: true }, { text: "I'm here to assist!", isUser: false }]);
      setUserInput('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
        {messages.map((msg, index) => (
          <View key={index} style={[styles.messageBubble, msg.isUser ? styles.userMessage : styles.botMessage]}>
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Type a message..."
          placeholderTextColor="#B0B0B0"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Image source={sendIcon} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.voiceButton, isRecording ? { backgroundColor: '#FF6347' } : { backgroundColor: '#4CAF50' }]}
          onPressIn={handleStartRecording}
          onPressOut={handleStopRecording}
        >
          <Image source={isRecording ? stopIcon : voiceIcon} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333', paddingTop: 20 },
  chatContainer: { flex: 1, paddingHorizontal: 10 },
  chatContent: { flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: { marginVertical: 5, padding: 10, borderRadius: 15, maxWidth: '80%', marginLeft: '10%' },
  userMessage: { backgroundColor: '#555', alignSelf: 'flex-end' },
  botMessage: { backgroundColor: '#666', alignSelf: 'flex-start' },
  messageText: { fontSize: 16, color: '#fff' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#ccc', alignItems: 'center' },
  input: { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 15, backgroundColor: '#fff', fontSize: 16 },
  sendButton: { padding: 10, backgroundColor: '#0078FF', borderRadius: 20 },
  voiceButton: { padding: 10, borderRadius: 20 },
  icon: { width: 24, height: 24 },
});

export default ChatBotScreen;
