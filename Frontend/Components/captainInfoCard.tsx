import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  vehiclePlateNo: string;
  vehicleType: string;
  hoursOnline?: number;
  status?: string;
}

const CaptainInfoCard = ({ status, toggleStatus }: CaptainInfoCardProps) => {
  const [captainData, setCaptainData] = useState<CaptainData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCaptainData = async () => {
    try {
      const data = await getLoggedInCaptain();
      console.log('Fetched captain data:', data);
      if (data) {
        const formattedData = {
          ...data,
          status: data.status || 'Offline'
        };
        console.log('Formatted captain data:', formattedData);
        setCaptainData(formattedData);
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

      const newStatus = status === 'Online' ? 'Offline' : 'Online';
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
  }, []);

  if (loading) {
    return (
      <View style={styles.detailsCard}>
        <Text>Loading captain information...</Text>
      </View>
    );
  }

  console.log('Rendering with captain data:', captainData);

  return (
    <View style={styles.detailsCard}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Image
            style={styles.avatar}
            source={{
              uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fm=jpg&q=60&w=3000',
            }}
          />
          <Text style={styles.name}>
            {captainData ? `${captainData.fullname.firstname} ${captainData.fullname.lastname}` : 'Captain'}
          </Text>
        </View>
        <View style={styles.earnings}>
          <Text style={styles.earningsText}>{captainData?.vehicleType || 'Vehicle'}</Text>
          <Text style={styles.label}>Vehicle Type</Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.statValue}>{captainData?.vehiclePlateNo || 'N/A'}</Text>
          <Text style={styles.label}>Plate Number</Text>
        </View>
        <View>
          <Text style={styles.statValue}>{captainData?.hoursOnline || '0'}</Text>
          <Text style={styles.label}>Hours Online</Text>
        </View>
      </View>

      <View style={[styles.rowBetween, { marginTop: 20 }]}>
        <View>
          <Text style={[styles.statusText, { color: status === 'Online' ? 'green' : 'red' }]}>
            {status}
          </Text>
          <Text style={styles.label}>Responder Status</Text>
        </View>
        <TouchableOpacity style={styles.statusBtn} onPress={handleStatusToggle}>
          <Text style={styles.statusBtnText}>
            {status === 'Online' ? 'Go Offline' : 'Go Online'}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
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
