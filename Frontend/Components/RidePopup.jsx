import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CaptainDetailsCard from './CaptainDetailsCard';

const EmergencyPopup = ({ onClose, emergencyData, remainingTime, onAccept }) => {
  const [rideStatus, setRideStatus] = useState(emergencyData?.status || 'pending');
  const [userData] = useState({
    name: emergencyData?.userName || 'Emergency User',
    email: emergencyData?.user?.email || null
  });
  const [captainDetails, setCaptainDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    console.log('[POPUP] Full emergency data:', JSON.stringify(emergencyData, null, 2));
  }, [emergencyData]);

  const handlePhonePress = () => {
    const mobileNumber = emergencyData?.user?.mobile;
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

        if (response.data?.updates) {
          const rideUpdates = response.data.updates.filter(
            update => update.rideId === emergencyData.rideId
          );

          if (rideUpdates.length > 0) {
            const latestUpdate = rideUpdates[rideUpdates.length - 1];
            switch (latestUpdate.type) {
              case 'ride_accepted':
                setRideStatus('accepted');
                if (latestUpdate.captainDetails) {
                  setCaptainDetails(latestUpdate.captainDetails);
                }
                break;
              case 'ride_started':
                setRideStatus('started');
                break;
              case 'no_drivers':
              case 'no_driver_accepted':
                setRideStatus('no_driver');
                onClose();
                break;
              default:
                break;
            }
          }
        }
      } catch (error) {
        console.error('[POPUP] Error polling ride status:', error);
      }
    };

    const statusInterval = setInterval(pollRideStatus, 5000);
    pollRideStatus();
    return () => clearInterval(statusInterval);
  }, [emergencyData?.rideId]);

  if (!emergencyData) {
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
          <Text style={styles.icon}>📱</Text>
          <View>
            <Text style={styles.detailTitle}>Contact Number</Text>
            <TouchableOpacity onPress={handlePhonePress}>
              <Text style={[styles.detailSubtitle, styles.phoneNumber]}>
                {emergencyData?.user?.mobile || 'No phone number available'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>📧</Text>
          <View>
            <Text style={styles.detailTitle}>Email Address</Text>
            <Text style={[styles.detailSubtitle, styles.emailText]}>
              {emergencyData?.user?.email || 'No email available'}
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

      {captainDetails && rideStatus === 'accepted' && (
        <CaptainDetailsCard captainDetails={captainDetails} />
      )}

      {rideStatus === 'pending' && (
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
      )}
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
    fontSize: 14,
    color: '#666',
  },
  phoneNumber: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  emailText: {
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  declineText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  acceptText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default EmergencyPopup;
