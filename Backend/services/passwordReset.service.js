const User = require('../models/user.model');
const Captain = require('../models/captain.model');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class PasswordResetService {
  // Generate OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email
  static async sendOTPViaEmail(email, otp) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <h1>Password Reset Request</h1>
          <p>Your OTP for password reset is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send OTP via email');
    }
  }

  // Initiate password reset
  static async initiatePasswordReset(email) {
    try {
      // Check both User and Captain models
      const user = await User.findOne({ email });
      const captain = await Captain.findOne({ email });

      if (!user && !captain) {
        throw new Error('No account found with this email');
      }

      // Generate OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP and expiry to the appropriate model
      if (user) {
        user.resetOTP = otp;
        user.resetOTPExpiry = otpExpiry;
        await user.save();
      } else if (captain) {
        captain.resetOTP = otp;
        captain.resetOTPExpiry = otpExpiry;
        await captain.save();
      }

      // Send OTP via email
      await this.sendOTPViaEmail(email, otp);

      return {
        success: true,
        message: 'OTP sent successfully to your email'
      };
    } catch (error) {
      console.error('Password reset initiation error:', error);
      throw error;
    }
  }

  // Verify OTP and reset password
  static async verifyOTPAndResetPassword(email, otp, newPassword) {
    try {
      // Check both User and Captain models
      const user = await User.findOne({
        email,
        resetOTP: otp,
        resetOTPExpiry: { $gt: Date.now() }
      });

      const captain = await Captain.findOne({
        email,
        resetOTP: otp,
        resetOTPExpiry: { $gt: Date.now() }
      });

      if (!user && !captain) {
        throw new Error('Invalid or expired OTP');
      }

      // Update password in the appropriate model
      if (user) {
        user.password = newPassword;
        user.resetOTP = undefined;
        user.resetOTPExpiry = undefined;
        await user.save();
      } else if (captain) {
        captain.password = newPassword;
        captain.resetOTP = undefined;
        captain.resetOTPExpiry = undefined;
        await captain.save();
      }

      return {
        success: true,
        message: 'Password reset successful'
      };
    } catch (error) {
      console.error('Password reset verification error:', error);
      throw error;
    }
  }
}

module.exports = PasswordResetService; 