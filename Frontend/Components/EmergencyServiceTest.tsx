import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { testLocationTracking } from '../app/utils/captainUtils';

const EmergencyServiceTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const testEmergencyService = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      // 1. Test Location Permissions
      addTestResult('Testing location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        addTestResult('❌ Location permission denied');
        return;
      }
      addTestResult('✅ Location permissions granted');

      // 2. Test Driver Location Tracking
      addTestResult('Testing driver location tracking...');
      const locationSuccess = await testLocationTracking();
      if (!locationSuccess) {
        addTestResult('❌ Driver location tracking failed');
        return;
      }
      addTestResult('✅ Driver location tracking working');

      // 3. Test Emergency Request Creation
      addTestResult('Testing emergency request creation...');
      const location = await Location.getCurrentPositionAsync({});
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/rides`,
        {
          emergencyLocation: {
            type: 'Point',
            coordinates: [location.coords.longitude, location.coords.latitude]
          },
          serviceType: 'police',
          emergencyType: 'test',
          description: 'Testing emergency service'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        addTestResult('✅ Emergency request created successfully');
        const rideId = response.data.ride._id;

        // 4. Test Status Updates
        addTestResult('Testing status updates...');
        const statusResponse = await axios.patch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/rides/${rideId}/status`,
          { status: 'in-progress' },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (statusResponse.status === 200) {
          addTestResult('✅ Status updates working');
        } else {
          addTestResult('❌ Status updates failed');
        }
      } else {
        addTestResult('❌ Emergency request creation failed');
      }

    } catch (error) {
      console.error('Test error:', error);
      addTestResult(`❌ Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.testButton, isTesting && styles.testButtonDisabled]}
        onPress={testEmergencyService}
        disabled={isTesting}
      >
        <Text style={styles.testButtonText}>
          {isTesting ? 'Testing...' : 'Test Emergency Service'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  testButton: {
    backgroundColor: '#1e40af',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  resultText: {
    marginBottom: 8,
    fontSize: 14,
  },
});

export default EmergencyServiceTest; 