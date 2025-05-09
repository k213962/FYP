import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface CaptainData {
  fullname: {
    firstname: string;
    lastname: string;
  };
  email: string;
  cnic: string;
  mobile: string;
  vehiclePlateNo: string;
  vehicleType: string;
  driverLicense: string;
  hoursOnline?: number;
  activeCalls?: number;
  totalResponses?: number;
  status?: string;
}

export const getLoggedInCaptain = async (): Promise<CaptainData | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }

    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_URL}/captain/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      console.log('Captain data:', response.data); // Debug log
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching captain data:', error);
    return null;
  }
};

const captainUtils = {
  getLoggedInCaptain,
};

export default captainUtils; 