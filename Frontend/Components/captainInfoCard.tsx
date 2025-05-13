import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, AppState } from 'react-native';
import { getLoggedInCaptain } from '../app/utils/captainUtils';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CaptainInfoCardProps {
  status: string;
  toggleStatus: () => void;
}

interface CaptainData {
  fullname: {
    firstname: string;
    lastname: string;
  };
  vehicleNoPlate: string;
  vehicleType: string;
  hoursOnline?: number;
  status?: string;
}

const CaptainInfoCard = ({ status: propStatus, toggleStatus }: CaptainInfoCardProps) => {
  const [captainData, setCaptainData] = useState<CaptainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('Offline');

  const setCaptainOffline = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.patch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/captain/status`,
        { status: 'Offline' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setCurrentStatus('Offline');
    } catch (error) {
      console.error('Error setting captain offline:', error);
    }
  };

  const fetchCaptainData = async () => {
    try {
      const data = await getLoggedInCaptain();
      if (data) {
        const formattedData = {
          ...data,
          status: data.status || 'Offline'
        };
        setCaptainData(formattedData);
        setCurrentStatus(formattedData.status || 'Offline');
      }
    } catch (error) {
      console.error('Error fetching captain data:', error);
      Alert.alert('Error', 'Failed to fetch captain data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      const newStatus = currentStatus === 'Online' ? 'Offline' : 'Online';
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/captain/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        setCurrentStatus(newStatus);
        toggleStatus();
        fetchCaptainData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  useEffect(() => {
    fetchCaptainData();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setCaptainOffline();
      }
    });

    return () => {
      subscription.remove();
      setCaptainOffline();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.detailsCard}>
        <Text>Loading captain information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailsCard}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Text style={styles.name}>
            {captainData?.fullname ? `${captainData.fullname.firstname} ${captainData.fullname.lastname}` : 'Captain'}
          </Text>
        </View>
        <View style={styles.earnings}>
          <Text style={styles.earningsText}>{captainData?.vehicleType || 'Vehicle'}</Text>
          <Text style={styles.label}>Vehicle Type</Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.statValue}>{captainData?.vehicleNoPlate || 'N/A'}</Text>
          <Text style={styles.label}>Plate Number</Text>
        </View>
        <View>
          <Text style={styles.statValue}>{captainData?.hoursOnline || '0'}</Text>
          <Text style={styles.label}>Hours Online</Text>
        </View>
      </View>

      <View style={[styles.rowBetween, { marginTop: 20 }]}>
        <View>
          <Text style={[styles.statusText, { color: currentStatus === 'Online' ? 'green' : 'red' }]}>
            {currentStatus}
          </Text>
          <Text style={styles.label}>Responder Status</Text>
        </View>
        <TouchableOpacity style={styles.statusBtn} onPress={handleStatusToggle}>
          <Text style={styles.statusBtnText}>
            {currentStatus === 'Online' ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CaptainInfoCard;

const styles = StyleSheet.create({
  detailsCard: {
    flex: 2,
    padding: 16,
    marginTop: -40,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  earnings: {
    alignItems: 'flex-end',
  },
  earningsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e40af',
    borderRadius: 20,
  },
  statusBtnText: {
    color: 'white',
    fontWeight: '600',
  }
});
