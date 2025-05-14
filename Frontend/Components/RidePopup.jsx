import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmergencyPopup = ({ onClose, emergencyData }) => {
  // Log when component renders for debugging
  console.log('[POPUP] RidePopup rendering with data:', JSON.stringify(emergencyData));

  // ✅ Prevent component from rendering if no data
  if (!emergencyData) {
    console.log('[POPUP] No emergency data, not rendering popup');
    return null;
  }

  // Add extra validation to ensure we have the core needed fields
  const isValidData = emergencyData.rideId && emergencyData.timeoutSeconds;
  if (!isValidData) {
    console.error('[POPUP] Invalid emergency data:', JSON.stringify(emergencyData));
    Alert.alert('Debug', 'Received invalid ride data');
    return null;
  }

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(emergencyData?.timeoutSeconds || 15);
  const timerRef = useRef(null);

  useEffect(() => {
    console.log('[POPUP] Setting up timer for ride popup');

    // Set up countdown timer
    if (emergencyData?.timeoutSeconds) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          console.log('[POPUP] Countdown:', newTime);
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            // Auto-close when timer expires
            console.log('[POPUP] Timer expired, closing popup');
            onClose();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [emergencyData?.timeoutSeconds]); 

  // Poll for ride status to check if another driver accepted it
  useEffect(() => {
    const checkRideStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const rideStatusResponse = await axios.get(
          `${process.env.EXPO_PUBLIC_BASE_URL}/rides/status-updates`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        const updates = rideStatusResponse.data.updates || [];
        
        // Check if this ride was accepted by another driver
        const acceptedByOther = updates.find(
          update => update.type === 'ride_accepted' && 
                   update.rideId === emergencyData.rideId
        );
        
        if (acceptedByOther) {
          Alert.alert(
            'Request Accepted',
            'Another driver has accepted this emergency request.',
            [{ text: 'OK', onPress: onClose }]
          );
        }
      } catch (error) {
        console.error('[POPUP] Error checking ride status:', error);
      }
    };
    
    // Check every 5 seconds
    const statusInterval = setInterval(checkRideStatus, 5000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [emergencyData.rideId]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      console.log('[POPUP] Accepting ride request for ID:', emergencyData?.rideId);
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        setLoading(false);
        return;
      }

      console.log('[POPUP] Sending accept request to server');
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/rides/${emergencyData?.rideId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('[POPUP] Accept response:', response.status, response.data);
      if (response.status === 200) {
        console.log('[POPUP] Successfully accepted ride, navigating to CaptainRiding');
        router.push({
          pathname: '/Pages/CaptainRiding',
          params: { rideId: emergencyData?.rideId }
        });
      }
    } catch (error) {
      console.error('[POPUP] Error accepting request:', error);
      if (error.response?.status === 400) {
        Alert.alert('Error', 'This request has already been accepted by another driver');
      } else {
        Alert.alert('Error', 'Failed to accept request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = () => {
    console.log('[POPUP] Ignoring ride request:', emergencyData.rideId);
    onClose();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowContainer} onPress={handleIgnore}>
        <Text style={styles.arrow}>↓</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🚨 Emergency Request! ({timeLeft}s)</Text>

      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Image
            style={styles.avatar}
            source={{
              uri: 'https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg',
            }}
          />
          <Text style={styles.username}>{emergencyData?.userName || 'Emergency User'}</Text>
        </View>
        <Text style={styles.distance}>{emergencyData?.distance || 'Nearby'}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📍</Text>
          <View>
            <Text style={styles.detailTitle}>Emergency Location</Text>
            <Text style={styles.detailSubtitle}>{emergencyData?.location || 'Location not specified'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>🚑</Text>
          <View>
            <Text style={styles.detailTitle}>Emergency Type</Text>
            <Text style={styles.detailSubtitle}>{emergencyData?.emergencyType || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>📝</Text>
          <View>
            <Text style={styles.detailTitle}>Description</Text>
            <Text style={styles.detailSubtitle}>{emergencyData?.description || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>🕒</Text>
          <View>
            <Text style={styles.detailTitle}>Estimated Arrival</Text>
            <Text style={styles.detailSubtitle}>{emergencyData?.estimatedArrivalTime || 'Unknown'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.declineButton} onPress={handleIgnore}>
          <Text style={styles.declineText}>Ignore</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.acceptButton, loading && styles.loadingButton]} 
          onPress={handleAccept}
          disabled={loading}
        >
          <Text style={styles.acceptText}>
            {loading ? 'Accepting...' : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
  },
  arrowContainer: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  arrow: {
    fontSize: 24,
    color: '#aaa',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#c0392b',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  distance: {
    color: '#555',
  },
  details: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 15,
    width: 24,
  },
  detailTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
  },
  detailSubtitle: {
    color: '#333',
    marginTop: 2,
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  declineText: {
    color: '#333',
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  loadingButton: {
    backgroundColor: '#a0dcb2',
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EmergencyPopup;
