import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface CaptainData {
  fullname: {
    firstname: string;
    lastname: string;
  };
  email: string;
  cnic: string;
  phone: string;
  vehicleNoPlate: string;
  vehicleType: string;
  driverLicense: string;
  hoursOnline?: number;
  status?: string;
}

export const getLoggedInCaptain = async (): Promise<CaptainData | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }

    console.log('Making request to:', `${process.env.EXPO_PUBLIC_BASE_URL}/captain/profile`);
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_URL}/captain/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200 && response.data) {
      console.log('Raw response data:', response.data);
      const data = response.data;
      
      // Transform the data to match our interface
      const transformedData: CaptainData = {
        fullname: data.fullname,
        email: data.email || '',
        cnic: data.cnic || '',
        phone: data.phone || '',
        vehicleNoPlate: data.vehicleNoPlate || '',
        vehicleType: data.vehicleType || '',
        driverLicense: data.driverLicense || '',
        hoursOnline: data.hoursOnline || 0,
        status: data.status || 'Offline'
      };
      
      console.log('Transformed data:', transformedData);
      return transformedData;
    }
    
    console.error('Invalid response:', response);
    return null;
  } catch (error) {
    console.error('Error fetching captain data:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Error message:', error.message);
    }
    return null;
  }
};

const captainUtils = {
  getLoggedInCaptain,
};

export default captainUtils; 