import { NextRequest } from 'next/server';
import { generateOTP, storeOTP } from '@/lib/otpService';
import { sendSMS } from '@/lib/smsGateway';
import { authLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { handleApiError, ApiError } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AppConfig from '@/models/AppConfig';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      throw new ApiError(400, 'Invalid phone number format. Please include country code.');
    }

    // Rate Limiting (Protects from SMS bombing)
    const ip = getClientIp(req);
    await checkRateLimit(authLimiter, `otp-send:${ip}`);
    
    // Additional rate limit per phone number to prevent spamming a single user
    await checkRateLimit(authLimiter, `otp-send-phone:${phone}`);

    // Check Feature Flag
    await connectDB();
    const config = await AppConfig.findById('global_config');
    if (config && config.phoneAuthEnabled === false) {
      throw new ApiError(403, 'Phone authentication is currently disabled.');
    }

    const otp = generateOTP();
    await storeOTP(phone, otp);

    const message = `Your MoniStream verification code is ${otp}. It is valid for 5 minutes. Do not share this code.`;
    const result = await sendSMS(phone, message);

    if (!result.success) {
      console.error('SMS Gateway Error:', result.error);
      throw new ApiError(502, 'Failed to send OTP message. Please try again later.');
    }

    return Response.json({
      success: true,
      message: 'OTP sent successfully',
      // If we are in simulated mode, it's safe to return the OTP in dev to make testing easier
      ...(result.simulated && process.env.NODE_ENV === 'development' ? { simulatedOtp: otp } : {})
    });
  } catch (error) {
    return handleApiError(error);
  }
}
