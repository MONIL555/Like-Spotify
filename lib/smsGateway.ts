// ============================================================
// MoniStream — SMS Gateway Service
// ============================================================

import axios from 'axios';

const gatewayClient = axios.create({
  baseURL: process.env.SMS_GATEWAY_URL,
  auth: {
    username: process.env.SMS_GATEWAY_USER || '',
    password: process.env.SMS_GATEWAY_PASS || '',
  },
  timeout: 10000,
});

export async function sendSMS(phoneNumber: string, message: string) {
  if (!process.env.SMS_GATEWAY_URL) {
    console.warn('SMS_GATEWAY_URL is not set. Simulating SMS send.');
    console.log(`[SIMULATED SMS to ${phoneNumber}]: ${message}`);
    return { success: true, simulated: true };
  }

  try {
    // This payload shape works for popular Android SMS gateway apps like capcom6
    const response = await gatewayClient.post('/message', {
      textMessage: { text: message },
      phoneNumbers: [phoneNumber],
    });
    return { success: true, data: response.data };
  } catch (err: any) {
    console.error('SMS send failed:', err.message);
    return { success: false, error: err.message };
  }
}
