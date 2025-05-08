import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from "expo-router";
const EmergencyPopup = ({ onClose }) => {
  const router = useRouter();
  return (

    <View style={styles.container}>
      {/* Arrow button */}
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
          <Text style={styles.username}>Sarah Khan</Text>
        </View>
        <Text style={styles.distance}>1.5 KM Away</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📍</Text>
          <View>
            <Text style={styles.detailTitle}>Incident Location</Text>
            <Text style={styles.detailSubtitle}>Near Gulshan Park, Block 7</Text>
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
        <TouchableOpacity onPress={() => router.push('/Pages/CaptainRiding')}
          style={styles.acceptButton}>
          <Text style={styles.acceptText}>Respond</Text>
           
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
    fontWeight: '600',
    fontSize: 16,
  },
  ignoreButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ignoreText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
});
