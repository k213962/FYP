import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';

import CaptainInfoCard from '../../Components/captainInfoCard';
import RidePopup from '../../Components/RidePopup'; // Static now
import { useRouter } from 'expo-router';

const Home = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Online');
  const [showRidePopup, setShowRidePopup] = useState(true);

  const popupAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    Animated.timing(popupAnim, {
      toValue: showRidePopup ? 0 : Dimensions.get('window').height,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [showRidePopup]);

  const toggleStatus = () => {
    setStatus((prev) => (prev === 'Online' ? 'Offline' : 'Online'));
  };

  const closePopup = () => {
    setShowRidePopup(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          style={styles.logo}
          source={{
            uri: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
          }}
        />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.push('./CaptainLogin')}
        >
          <Image
            source={require('../../assets/images/logoutcaptain.png')}
            style={styles.logoutImage}
          />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.imageSection}>
        <Image
          style={styles.heroImage}
          source={{
            uri: 'https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif',
          }}
        />
      </View>

      {/* Info Card */}
      <CaptainInfoCard status={status} toggleStatus={toggleStatus} />

      {/* Ride Popup */}
      <Animated.View
        style={[
          {
            transform: [{ translateY: popupAnim }],
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
        ]}
      >
        <RidePopup onClose={() => setShowRidePopup(false)} />
      </Animated.View>
    </View>
  );
};

export default Home;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width,
  },
  logo: {
    width: 64,
    height: 20,
    resizeMode: 'contain',
  },
  logoutBtn: {
    height: 40,
    width: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  logoutImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  imageSection: {
    flex: 3,
    marginTop: 80,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
