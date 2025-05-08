import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const CaptainInfoCard = ({ status, toggleStatus }) => {
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
          <Text style={styles.name}>Captain 1</Text>
        </View>
        <View style={styles.earnings}>
          <Text style={styles.earningsText}>Ambulance</Text>
          <Text style={styles.label}>Vehicle Type</Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.statValue}>AB-1234</Text>
          <Text style={styles.label}>Plate Number</Text>
        </View>
        <View>
          <Text style={styles.statValue}>10.3</Text>
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
        <TouchableOpacity style={styles.statusBtn} onPress={toggleStatus}>
          <Text style={styles.statusBtnText}>
            {status === 'Online' ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, { marginTop: 24 }]}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🕒</Text>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.label}>Active Calls</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.label}>Total Responses</Text>
        </View>
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
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
});
