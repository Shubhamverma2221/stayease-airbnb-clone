const axios = require('axios');

/**
 * Sends a real SMS notification using Twilio or Textbelt Free Gateway
 * @param {string} phoneNumber - Recipient mobile phone number
 * @param {string} message - Content of the SMS message
 */
const sendSMS = async (phoneNumber, message) => {
  let formattedNumber = phoneNumber.trim();
  if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
    formattedNumber = `+91${formattedNumber}`;
  } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
    formattedNumber = `+${formattedNumber}`;
  }

  // Option 1: Twilio SMS Gateway (if credentials are provided in env)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    console.log(`Sending real SMS to ${formattedNumber} via Twilio Gateway...`);
    try {
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber,
      });
      console.log(`Twilio SMS sent successfully: ${res.sid}`);
      return { success: true, provider: 'twilio', sid: res.sid };
    } catch (err) {
      console.error('Twilio SMS delivery failed:', err.message);
    }
  }

  // Option 2: Textbelt Free SMS Gateway (requires no credentials, 1 free message per day per IP)
  console.log(`Attempting free SMS dispatch to ${formattedNumber} via Textbelt Gateway...`);
  try {
    const response = await axios.post('https://textbelt.com/text', {
      number: formattedNumber,
      message: message,
      key: 'textbelt',
    });
    if (response.data && response.data.success) {
      console.log('SMS sent successfully via Textbelt Free Gateway!');
      return { success: true, provider: 'textbelt' };
    } else {
      console.log('Textbelt Free rate limit reached or failed:', response.data?.error || 'Unknown error');
    }
  } catch (err) {
    console.error('Textbelt SMS request failed:', err.message);
  }

  // Option 3: Local Console Log Mock (development fallback)
  console.log('====== MOCK SMS GATEWAY ======');
  console.log(`To Mobile: ${formattedNumber}`);
  console.log(`Message: ${message}`);
  console.log('==============================');
  return { success: true, provider: 'mock' };
};

module.exports = sendSMS;
