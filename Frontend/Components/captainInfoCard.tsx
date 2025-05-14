import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, AppState, Switch } from 'react-native';
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
  const [isOnline, setIsOnline] = useState(false);

  const syncWithParentStatus = () => {
    if (propStatus !== currentStatus) {
      console.log(`[CARD] Syncing status with parent: Offline`);
      setCurrentStatus('Offline');
      setIsOnline(false);
    }
  };

  const fetchCaptainData = async () => {
    try {
      const data = await getLoggedInCaptain();
      if (data) {
        const formattedData = {
          ...data,
          status: 'Offline' // Always set to Offline
        };
        setCaptainData(formattedData);
        setCurrentStatus('Offline');
        setIsOnline(false);
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
      console.log('[CARD] Changing captain status from', currentStatus, 'to', newStatus);
      
      setLoading(true);
      
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/captain/status`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log('[CARD] Status successfully changed to', newStatus);
        setCurrentStatus(newStatus);
        setIsOnline(newStatus === 'Online');
        toggleStatus();
        
        Alert.alert(
          'Status Updated',
          `You are now ${newStatus}. ${newStatus === 'Online' ? 'You can now receive emergency requests.' : 'You will not receive any emergency requests.'}`
        );
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('[CARD] Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
      // Revert the switch if there was an error
      setIsOnline(currentStatus === 'Online');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptainData();
  }, []);

  useEffect(() => {
    syncWithParentStatus();
  }, [propStatus]);

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
          <Text style={[styles.statusText, { color: isOnline ? '#10b981' : '#ef4444' }]}>
            {currentStatus}
          </Text>
          <Text style={styles.label}>Responder Status</Text>
        </View>
        <View style={styles.toggleContainer}>
          <Switch
            trackColor={{ false: '#ef4444', true: '#10b981' }}
            thumbColor={isOnline ? '#fff' : '#fff'}
            ios_backgroundColor="#ef4444"
            onValueChange={handleStatusToggle}
            value={isOnline}
            disabled={loading}
          />
          <Text style={[styles.toggleLabel, { color: isOnline ? '#10b981' : '#ef4444' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CaptainInfoCard;

const styles = StyleSheet.create({
  detailsCard: {
    height: 200,
    padding: 12,
    marginTop: -40,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  earnings: {
    alignItems: 'flex-end',
  },
  earningsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  }
});
