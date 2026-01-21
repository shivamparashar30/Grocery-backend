const admin = require('firebase-admin');

// Download service account key from Firebase Console
// Project Settings → Service Accounts → Generate new private key
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendPushNotification = async (fcmTokens, title, body, data = {}) => {
  try {
    const message = {
      notification: { title, body },
      data,
      tokens: Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens],
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};