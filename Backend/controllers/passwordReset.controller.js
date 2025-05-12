const PasswordResetService = require('../services/passwordReset.service');

// Initiate password reset
exports.initiatePasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await PasswordResetService.initiatePasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to email and phone'
    });

  } catch (error) {
    console.error('Password reset initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate password reset'
    });
  }
};

// Verify OTP and reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const result = await PasswordResetService.verifyOTPAndResetPassword(
      email,
      otp,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
}; 