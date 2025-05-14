import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmergencyPopup = ({ onClose, emergencyData, remainingTime, onAccept }) => {
  const [rideStatus, setRideStatus] = useState(emergencyData?.status || 'pending');
  const [userData] = useState({
    name: emergencyData?.userName || 'Emergency User',
    mobile: emergencyData?.user?.mobile || null,
    email: emergencyData?.user?.email || null
  });
  const router = useRouter();

  // Debug log to see the structure
  useEffect(() => {
    console.log('[POPUP] Full emergency data:', JSON.stringify(emergencyData, null, 2));
    console.log('[POPUP] User mobile:', userData.mobile);
  }, [emergencyData]);

  const handlePhonePress = () => {
    const mobileNumber = emergencyData?.user?.mobile || userData.mobile;
    if (mobileNumber) {
      Linking.openURL(`tel:${mobileNumber}`);
    } else {
      Alert.alert('No Phone Number', 'User phone number is not available.');
    }
  };

  // Poll for ride status updates
  useEffect(() => {
    const pollRideStatus = async () => {
      try {
        if (!emergencyData?.rideId) {
          console.log('[POPUP] No ride ID available for status polling');
          return;
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('[POPUP] No token available for status polling');
          return;
        }

        console.log('[POPUP] Polling ride status updates');

        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BASE_URL}/rides/status-updates`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log('[POPUP] Status updates response:', response.data);

        if (response.data?.updates) {
          // Find relevant updates for this ride
          const rideUpdates = response.data.updates.filter(
            update => update.rideId === emergencyData.rideId
          );

          if (rideUpdates.length > 0) {
            // Get the most recent update
            const latestUpdate = rideUpdates[rideUpdates.length - 1];
            
            // Update status based on update type
            switch (latestUpdate.type) {
              case 'ride_accepted':
                setRideStatus('accepted');
                // Update user data if available in the update
                if (latestUpdate.userData) {
                  setUserData({
                    name: latestUpdate.userData.name || userData.name,
                    mobile: latestUpdate.userData.mobile || userData.mobile,
                    email: latestUpdate.userData.email || userData.email
                  });
                }
                break;
              case 'ride_started':
                setRideStatus('started');
                break;
              case 'no_drivers':
              case 'no_driver_accepted':
                setRideStatus('no_driver');
                onClose(); // Close popup if no drivers available
                break;
              default:
                // Keep existing status
                break;
            }
          }
        }
      } catch (error) {
        console.error('[POPUP] Error polling ride status:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          message: error.message
        });
      }
    };

    const statusInterval = setInterval(pollRideStatus, 5000);
    
    // Initial poll
    pollRideStatus();

    return () => clearInterval(statusInterval);
  }, [emergencyData?.rideId]);

  if (!emergencyData) {
    console.log('[POPUP] No emergency data provided');
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowContainer} onPress={onClose}>
        <Text style={styles.arrow}>↓</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        🚨 Emergency Request! {remainingTime > 0 && `(${remainingTime}s)`}
      </Text>

      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <View style={styles.userHeader}>
              <Text style={styles.username}>{userData.name}</Text>
              <Text style={[
                styles.statusBadge,
                rideStatus === 'accepted' && styles.statusAccepted,
                rideStatus === 'no_driver' && styles.statusNoDriver
              ]}>
                Status: {rideStatus}
              </Text>
            </View>
            
            {/* User Contact Information */}
            <View style={styles.contactInfo}>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handlePhonePress}
              >
                <Text style={styles.icon}>📱</Text>
                <Text style={styles.contactText}>
                  {emergencyData?.user?.mobile || 'No phone number available'}
                </Text>
              </TouchableOpacity>
              {userData.email && (
                <View style={styles.contactItem}>
                  <Text style={styles.icon}>✉️</Text>
                  <Text style={styles.contactText}>{userData.email}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📍</Text>
          <View>
            <Text style={styles.detailTitle}>Emergency Location</Text>
            <Text style={styles.detailSubtitle}>
              {emergencyData?.emergencyLocation?.address || 
               (emergencyData?.emergencyLocation?.coordinates ? 
                `${emergencyData.emergencyLocation.coordinates[1].toFixed(4)}, ${emergencyData.emergencyLocation.coordinates[0].toFixed(4)}` : 
                'Location not specified')}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>⏰</Text>
          <View>
            <Text style={styles.detailTitle}>Request Time</Text>
            <Text style={styles.detailSubtitle}>
              {new Date(emergencyData?.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.declineButton} onPress={onClose}>
          <Text style={styles.declineText}>Ignore</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.acceptButton]} 
          onPress={onAccept}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
  },
  arrowContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  arrow: {
    fontSize: 22,
    color: '#aaa',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#c0392b',
  },
  card: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  userDetails: {
    width: '100%',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfo: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  statusBadge: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  statusAccepted: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusNoDriver: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
    width: 22,
  },
  detailTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#555',
  },
  detailSubtitle: {
    color: '#333',
    marginTop: 2,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  declineText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default EmergencyPopup;
