import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const ResetPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    try {
      if (!email) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }

      setIsLoading(true);
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseUrl) {
        Alert.alert('Error', 'Base URL is not defined');
        return;
      }

      const response = await axios.post(
        `${baseUrl}/user/forgot-password`,
        { email }
      );

      if (response.status === 200) {
        setOtpSent(true);
        Alert.alert(
          'OTP Sent',
          'Please check your email and phone for the OTP'
        );
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send OTP'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!otp || !newPassword || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      if (newPassword.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long');
        return;
      }

      setIsLoading(true);
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseUrl) {
        Alert.alert('Error', 'Base URL is not defined');
        return;
      }

      const response = await axios.post(
        `${baseUrl}/user/reset-password`,
        {
          email,
          otp,
          newPassword
        }
      );

      if (response.status === 200) {
        Alert.alert(
          'Success',
          'Password reset successful',
          [
            {
              text: 'OK',
              onPress: () => router.replace('./UserLogin')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error resetting password:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to reset password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? 'Enter the OTP sent to your email and phone'
              : 'Enter your email to receive OTP'}
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!otpSent}
                placeholderTextColor="#666"
              />
            </View>

            {otpSent && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>OTP</Text>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter OTP"
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      style={[styles.input, styles.passwordInput]}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#666"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      style={[styles.input, styles.passwordInput]}
                      secureTextEntry={!showConfirmPassword}
                      placeholderTextColor="#666"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={otpSent ? handleResetPassword : handleSendOTP}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading
                  ? 'Processing...'
                  : otpSent
                  ? 'Reset Password'
                  : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 15,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetPassword; 