// services/firebaseService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // For local development - use service account file
    if (process.env.NODE_ENV === 'development') {
      const serviceAccount = require('../config/firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } 
    // For production (Vercel) - use environment variables
    else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
};

// Initialize on module load
initializeFirebase();

/**
 * Send push notification to multiple devices
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise}
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  try {
    // Ensure Firebase is initialized
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    // Filter out invalid tokens
    const validTokens = tokens.filter(token => token && token.length > 0);

    if (validTokens.length === 0) {
      console.log('No valid FCM tokens provided');
      return { success: false, message: 'No valid tokens' };
    }

    console.log(`Sending notification to ${validTokens.length} device(s)`);
    console.log('Notification title:', title);
    console.log('Notification body:', body);

    // Convert all data values to strings (FCM requirement)
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    // Create message
    const message = {
      notification: {
        title,
        body,
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: validTokens,
    };

    // Send notification
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('✅ Successfully sent notifications:', response.successCount);
    console.log('❌ Failed notifications:', response.failureCount);

    // Log failures
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${validTokens[idx]}:`, resp.error);
        }
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

/**
 * Send notification to a single device
 */
const sendSingleNotification = async (token, title, body, data = {}) => {
  return sendPushNotification([token], title, body, data);
};

/**
 * Send notification to topic subscribers
 */
const sendToTopic = async (topic, title, body, data = {}) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    // Convert data to strings
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    const message = {
      notification: { title, body },
      data: stringifiedData,
      topic,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent to topic:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending to topic:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
  sendSingleNotification,
  sendToTopic,
};