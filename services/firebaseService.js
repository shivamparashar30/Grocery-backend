const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables instead of JSON file
let firebaseApp;

try {
  // Check if already initialized
  if (!admin.apps.length) {
    // Parse the service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

exports.sendPushNotification = async (fcmTokens, title, body, data = {}) => {
  try {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      console.error('Firebase not initialized');
      return null;
    }

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