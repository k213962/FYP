import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CaptainDetailsCardProps {
  captainDetails: {
    name: {
      firstname: string;
      lastname: string;
    };
    phone: string;
    vehicleType: string;
    vehicleNoPlate: string;
    rating?: number;
  };
}

const CaptainDetailsCard = ({ captainDetails }: CaptainDetailsCardProps) => {
  const handlePhonePress = () => {
    if (captainDetails.phone) {
      Linking.openURL(`tel:${captainDetails.phone}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Captain Details</Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialIcons name="person" size={24} color="#007AFF" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {captainDetails.name.firstname} {captainDetails.name.lastname}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.detailRow} onPress={handlePhonePress}>
          <MaterialIcons name="phone" size={24} color="#007AFF" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.label}>Phone</Text>
            <Text style={[styles.value, styles.phoneNumber]}>
              {captainDetails.phone}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.detailRow}>
          <MaterialIcons name="directions-car" size={24} color="#007AFF" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.label}>Vehicle</Text>
            <Text style={styles.value}>
              {captainDetails.vehicleType} - {captainDetails.vehicleNoPlate}
            </Text>
          </View>
        </View>

        {captainDetails.rating && (
          <View style={styles.detailRow}>
            <MaterialIcons name="star" size={24} color="#007AFF" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.label}>Rating</Text>
              <Text style={styles.value}>{captainDetails.rating.toFixed(1)} ⭐</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  phoneNumber: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default CaptainDetailsCard; 