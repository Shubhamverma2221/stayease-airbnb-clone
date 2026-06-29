const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const accountSid = process.env.TWILIO_ACCOUNT_SID || process.argv[2];
const authToken = process.env.TWILIO_AUTH_TOKEN || process.argv[3];

if (!accountSid || !authToken) {
  console.error('ERROR: Please provide TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
  console.error('Usage: node setupTwilio.js <ACCOUNT_SID> <AUTH_TOKEN>');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function run() {
  try {
    console.log('Fetching active Twilio phone numbers...');
    const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 1 });
    
    if (incomingNumbers.length === 0) {
      console.error('ERROR: No active Twilio phone numbers found on this account.');
      console.error('Please purchase a free trial phone number inside your Twilio Console (https://console.twilio.com) first!');
      process.exit(1);
    }

    const twilioNumber = incomingNumbers[0].phoneNumber;
    console.log(`Active Twilio Phone Number Found: ${twilioNumber}`);

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    let lines = envContent.split('\n').filter(l => 
      !l.trim().startsWith('TWILIO_ACCOUNT_SID=') && 
      !l.trim().startsWith('TWILIO_AUTH_TOKEN=') && 
      !l.trim().startsWith('TWILIO_PHONE_NUMBER=')
    );

    lines.push(`TWILIO_ACCOUNT_SID=${accountSid}`);
    lines.push(`TWILIO_AUTH_TOKEN=${authToken}`);
    lines.push(`TWILIO_PHONE_NUMBER=${twilioNumber}`);

    fs.writeFileSync(envPath, lines.join('\n').trim() + '\n', 'utf8');
    console.log('SUCCESS: server/.env configuration updated successfully!');
  } catch (err) {
    console.error('Twilio Authentication Setup Failed:', err.message);
    process.exit(1);
  }
}

run();
