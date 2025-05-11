import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const EmergencyPopup = ({ onClose, emergencyData }) => {
  // ✅ Prevent component from rendering if no data
  if (!emergencyData) return null;

  const router = useRouter();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.EXPO_PUBLIC_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('emergencyRequestAccepted', (data) => {
      if (data.rideId === emergencyData?.rideId) {
        Alert.alert(
          'Request Accepted',
          'Another driver has accepted this emergency request.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [emergencyData?.rideId]); // ✅ use optional chaining

  const handleAccept = async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/rides/${emergencyData?.rideId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      );

      if (response.status === 200) {
        router.push({
          pathname: '/Pages/CaptainRiding',
          params: { rideId: emergencyData?.rideId }
        });
      }
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert('Error', 'This request has already been accepted by another driver');
      } else {
        Alert.alert('Error', 'Failed to accept request. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowContainer} onPress={onClose}>
        <Text style={styles.arrow}>↓</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🚨 Emergency Request!</Text>

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
            <Text style={styles.detailTitle}>Reported</Text>
            <Text style={styles.detailSubtitle}>Just now</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={handleAccept} style={styles.acceptButton}>
          <Text style={styles.acceptText}>Accept Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ignoreButton} onPress={onClose}>
          <Text style={styles.ignoreText}>Ignore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmergencyPopup;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
  },
  arrowContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  arrow: {
    fontSize: 32,
    color: '#aaa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#dc2626',
  },
  card: {
    backgroundColor: '#fde68a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  distance: {
    fontWeight: '600',
    fontSize: 16,
    color: '#b91c1c',
  },
  details: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  buttons: {
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ignoreButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ignoreText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
});
