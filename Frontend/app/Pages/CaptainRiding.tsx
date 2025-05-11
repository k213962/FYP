import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

interface Ride {
  _id: string;
  emergencyType: string;
  emergencyLocation: {
    address?: string;
    coordinates: [number, number];
  };
  status: 'pending' | 'accepted' | 'ride-started' | 'completed' | 'cancelled';
  actualArrivalTime?: string;
}

const socket: Socket = io(process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000');

const CaptainRiding = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rideId = params.rideId as string;

    if (!rideId) {
      setError('No ride ID provided');
      setLoading(false);
      return;
    }

    fetchRideDetails(rideId);

    // Join the ride room for real-time updates
    socket.emit('joinRoom', `ride_${rideId}`);

    // Listen for ride updates
    socket.on('rideUpdated', (updatedRide: Ride) => {
      if (updatedRide._id === rideId) {
        setRide(updatedRide);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leaveRoom', `ride_${rideId}`);
      socket.off('rideUpdated');
    };
  }, [params.rideId]);

  const fetchRideDetails = async (rideId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        router.replace('/Pages/UserLogin');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseUrl) {
        setError('Base URL is not defined');
        return;
      }

      const response = await axios.get(`${baseUrl}/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.ride) {
        setRide(response.data.ride);
      } else {
        setError('Invalid ride data received');
      }
    } catch (error: any) {
      console.error('Error fetching ride details:', error);
      setError(error.response?.data?.message || 'Failed to fetch ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!params.rideId) {
      Alert.alert('Error', 'No ride ID available');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        router.replace('/Pages/UserLogin');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseUrl) {
        Alert.alert('Error', 'Base URL is not defined');
        return;
      }

      const response = await axios.post(
        `${baseUrl}/rides/${params.rideId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 && response.data.ride) {
        setRide(response.data.ride);
        Alert.alert('Success', 'Ride started successfully');
      } else {
        Alert.alert('Error', 'Failed to start ride');
      }
    } catch (error: any) {
      console.error('Error starting ride:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start ride');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/Pages/Home')}>
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/Pages/Home')}>
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Details</Text>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>Emergency Type: {ride.emergencyType}</Text>
        <Text style={styles.detailText}>Status: {ride.status}</Text>
        {ride.emergencyLocation?.address && (
          <Text style={styles.detailText}>Location: {ride.emergencyLocation.address}</Text>
        )}
        {ride.actualArrivalTime && (
          <Text style={styles.detailText}>
            Arrival Time: {new Date(ride.actualArrivalTime).toLocaleString()}
          </Text>
        )}
      </View>
      {ride.status === 'accepted' && (
        <TouchableOpacity style={styles.button} onPress={handleStartRide}>
          <Text style={styles.buttonText}>Start Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#dc2626',
    marginBottom: 20,
  },
});

export default CaptainRiding;
