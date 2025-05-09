import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface UserData {
  fullname: {
    firstname: string;
    lastname: string;
  };
  email: string;
  cnic: string;
  mobile: string;
}

export const getLoggedInUser = async (): Promise<UserData | null> => {
  try {
    // Get the token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.log('No token found');
      return null;
    }

    // Make API call to get user profile
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_URL}/users/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.status === 200) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

const userUtils = {
  getLoggedInUser
};

export default userUtils; 