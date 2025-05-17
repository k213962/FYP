import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Platform,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

// API configuration
const API_KEY = 'your_api_key';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// AssemblyAI configuration
const ASSEMBLYAI_API_KEY = 'your_api_key';
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com';

// System prompt for EmergiVoice
const SYSTEM_PROMPT = `You are EmergiVoice, an AI assistant trained to act as both a 911 emergency chatbot and dispatcher.
You are the only authority involved in the conversation. Never refer to third parties like 'another dispatcher', 'emergency services coordinator', or 'emergency service dispatcher'.

Your responsibilities include:

1. Remaining calm, professional, and empathetic throughout the conversation.
2. Gathering critical information about emergencies in a structured way:
   * Nature of the emergency (medical, fire, crime, etc.)
   * Number of people involved and their conditions (breathing, conscious, injuries, etc.)
   * Any immediate dangers or hazards (fire, traffic, weapons, etc.)
3. Providing clear instructions for immediate actions the user should take.
4. Emphasizing the urgency of the situation, especially in critical medical emergencies like cardiac arrest.
5. Offering emotional support to the user, reassuring them that help is on the way.
6. If the user is untrained in CPR, reassuring them they can still perform hands-only CPR and guiding them step-by-step.
7. Being proactive in asking about the status of breathing during CPR situations.
8. Dispatching appropriate emergency services based on the nature of the emergency.
9. Staying engaged with the user if needed until emergency services arrive.
10. Never asking for the same information twice.
11. Prioritizing information gathering in order of importance for dispatching.
12. If the message is a prank, remaining calm and informing the user about the seriousness of the service.
13. Never asking quiz questions or multiple-choice options.
14. You are responsible for all emergency decisions — never mention other agents, AI, or departments.

Speak naturally, like a calm and focused emergency chatbot helping someone in distress.`;

type Recording = Audio.Recording | null;

export default function ChatBotScreen() {
  const router = useRouter();
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "This is EmergiVoice. I'm here to assist you in an emergency. Please tell me what happened.", isUser: false },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Recording>(null);
  const [recordingPermission, setRecordingPermission] = useState(false);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Request audio permissions
  useEffect(() => {
    const getAudioPermission = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setRecordingPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to use voice features.',
          [
            { text: 'OK' }
          ]
        );
      }
    };
    
    getAudioPermission();

    // Initial welcome message text-to-speech
    if (textToSpeechEnabled) {
      Speech.speak(
        "This is EmergiVoice. I'm here to assist you in an emergency. Please tell me what happened.",
        {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
          onStart: () => setIsSpeaking(true),
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: (error) => {
            console.error('Speech error:', error);
            setIsSpeaking(false);
          },
        }
      );
    }

    // Cleanup speech on unmount
    return () => {
      Speech.stop();
    };
  }, []);

  // Configure audio mode
  const configureAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  };

  // Start recording
  const startRecording = async () => {
    if (!recordingPermission) {
      Alert.alert('Permission Error', 'Microphone permission is required for voice input.');
      return;
    }

    // Stop any ongoing speech before recording
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }

    try {
      await configureAudio();
      console.log('Starting recording...');
      setIsRecording(true);

      // Use simpler recording options to ensure compatibility
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 2, // AAC ADTS format
          audioEncoder: 3, // AAC
          sampleRate: 16000, // Lower sample rate for better compatibility
          numberOfChannels: 1, // Mono for better compatibility
          bitRate: 64000, // Lower bitrate
        },
        ios: {
          extension: '.m4a',
          outputFormat: 1, // AAC ADTS format (value 1)
          audioQuality: 0x02, // Medium quality (value 2)
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 64000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 64000,
        }
      };

      // Fall back to default options if custom ones fail
      try {
        const { recording } = await Audio.Recording.createAsync(recordingOptions);
        setRecording(recording);
      } catch (err) {
        console.warn('Failed with custom options, trying default options:', err);
        const { recording } = await Audio.Recording.createAsync();
        setRecording(recording);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop recording and transcribe
  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      setIsTranscribing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording saved at:', uri);
      
      if (uri) {
        await transcribeAudio(uri);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to process recording.');
      setIsTranscribing(false);
    }
  };

  // Upload audio to AssemblyAI and transcribe
  const transcribeAudio = async (audioUri: string) => {
    try {
      console.log('Reading audio file...');
      
      // Read the audio file as binary
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to binary
      const audioBuffer = Uint8Array.from(atob(audioFile), c => c.charCodeAt(0));
      
      console.log('Uploading to AssemblyAI...');
      
      // Upload audio to AssemblyAI
      const uploadResponse = await axios.post(
        `${ASSEMBLYAI_BASE_URL}/v2/upload`,
        audioBuffer,
        {
          headers: {
            authorization: ASSEMBLYAI_API_KEY,
            'content-type': 'application/octet-stream'
          }
        }
      );
      
      const audioUrl = uploadResponse.data.upload_url;
      console.log('Audio uploaded, starting transcription...');
      
      // Start transcription
      const transcriptionResponse = await axios.post(
        `${ASSEMBLYAI_BASE_URL}/v2/transcript`,
        {
          audio_url: audioUrl,
          speech_model: 'universal',
        },
        {
          headers: {
            authorization: ASSEMBLYAI_API_KEY,
            'content-type': 'application/json'
          }
        }
      );
      
      const transcriptId = transcriptionResponse.data.id;
      console.log('Transcription started with ID:', transcriptId);
      
      // Poll for completion
      await pollTranscription(transcriptId);
      
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert(
        'Transcription Error',
        'Failed to transcribe audio. Please try typing instead.',
        [{ text: 'OK' }]
      );
      setIsTranscribing(false);
    }
  };

  // Poll transcription status
  const pollTranscription = async (transcriptId: string) => {
    const pollingEndpoint = `${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcriptId}`;
    
    try {
      while (true) {
        console.log('Polling transcription status...');
        
        const pollingResponse = await axios.get(pollingEndpoint, {
          headers: {
            authorization: ASSEMBLYAI_API_KEY
          }
        });
        
        const result = pollingResponse.data;
        console.log('Transcription status:', result.status);
        
        if (result.status === 'completed') {
          console.log('Transcription completed:', result.text);
          setUserInput(result.text);
          setIsTranscribing(false);
          break;
        } else if (result.status === 'error') {
          throw new Error(`Transcription failed: ${result.error}`);
        } else {
          // Wait 3 seconds before polling again
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      Alert.alert('Transcription Error', 'Failed to complete transcription.');
      setIsTranscribing(false);
    }
  };

  // Toggle recording
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Speak text using text-to-speech
  const speakText = (text: string) => {
    if (!textToSpeechEnabled) return;
    
    // Stop any ongoing speech
    Speech.stop();
    
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: (error) => {
        console.error('Speech error:', error);
        setIsSpeaking(false);
      },
    });
  };

  // Toggle text-to-speech
  const toggleTextToSpeech = () => {
    if (textToSpeechEnabled) {
      // Stop speech if it's currently playing
      Speech.stop();
      setIsSpeaking(false);
    }
    setTextToSpeechEnabled(!textToSpeechEnabled);
  };

  // Send message to API
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Stop any ongoing speech
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }

    const userMessage = userInput.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: SYSTEM_PROMPT
            },
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not process that request.';
      
      setMessages(prev => [...prev, { text: botResponse, isUser: false }]);
      
      // Speak the bot's response using text-to-speech
      speakText(botResponse);
      
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = 'Sorry, I am having trouble connecting. Please check your internet connection and try again.';
      setMessages(prev => [...prev, { 
        text: errorMessage, 
        isUser: false 
      }]);
      
      // Speak the error message
      speakText(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and TTS toggle */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/Pages/NavOptions')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EmergiVoice</Text>
        <View style={styles.ttsContainer}>
          <MaterialIcons name={textToSpeechEnabled ? "volume-up" : "volume-off"} size={20} color="#fff" />
          <Switch
            value={textToSpeechEnabled}
            onValueChange={toggleTextToSpeech}
            thumbColor={textToSpeechEnabled ? "#4CAF50" : "#f4f3f4"}
            trackColor={{ false: "#767577", true: "#81c784" }}
            style={styles.ttsSwitch}
          />
        </View>
      </View>

      {/* Chat messages */}
      <ScrollView 
        style={styles.chatContainer} 
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <View 
            key={index} 
            style={[
              styles.messageBubble, 
              msg.isUser ? styles.userMessage : styles.botMessage
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
            {!msg.isUser && (
              <TouchableOpacity 
                style={styles.speakButton}
                onPress={() => speakText(msg.text)}
                disabled={isSpeaking}
              >
                <MaterialIcons 
                  name="volume-up" 
                  size={18} 
                  color="#fff" 
                  style={{opacity: isSpeaking ? 0.5 : 1}}
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {isLoading && (
          <View style={[styles.messageBubble, styles.botMessage, styles.loadingMessage]}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>EmergiVoice is responding...</Text>
          </View>
        )}
      </ScrollView>

      {/* Voice status indicator */}
      {(isRecording || isTranscribing || isSpeaking) && (
        <View style={styles.voiceStatusContainer}>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <MaterialIcons name="mic" size={20} color="#fff" />
              <Text style={styles.statusText}>Recording...</Text>
            </View>
          )}
          {isTranscribing && (
            <View style={styles.transcribingIndicator}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusText}>Transcribing...</Text>
            </View>
          )}
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <MaterialIcons name="volume-up" size={20} color="#fff" />
              <Text style={styles.statusText}>Speaking...</Text>
            </View>
          )}
        </View>
      )}

      {/* Input container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Describe your emergency or use voice..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        
        {/* Voice button */}
        <TouchableOpacity
          style={[
            styles.voiceButton,
            { 
              backgroundColor: isRecording ? '#FF6347' : (isTranscribing ? '#FFA500' : '#4CAF50')
            }
          ]}
          onPress={toggleRecording}
          disabled={isLoading || isTranscribing || !recordingPermission}
        >
          <MaterialIcons 
            name={isRecording ? "stop" : (isTranscribing ? "hourglass-empty" : "mic")} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: userInput.trim() ? 1 : 0.5 }
          ]}
          onPress={handleSendMessage}
          disabled={!userInput.trim() || isLoading}
        >
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  ttsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 70,
  },
  ttsSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginLeft: 5,
  },
  placeholder: {
    width: 34,
  },
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  emergencyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatContent: {
    paddingVertical: 10,
  },
  messageBubble: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 20,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    flex: 1,
  },
  speakButton: {
    marginLeft: 8,
    padding: 5,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  voiceStatusContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    marginBottom: 5,
  },
  transcribingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFA500',
    borderRadius: 10,
    marginBottom: 5,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: '#2c2c2c',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#000',
    marginRight: 10,
  },
  voiceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
