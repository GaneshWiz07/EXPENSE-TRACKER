import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initializeFirebaseAdmin = async () => {
  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized');
      return;
    }

    // Path to service account key file
    const serviceAccountPath = join(__dirname, 'firebaseServiceAccountKey.json');

    // Read service account key
    const serviceAccountJson = await readFile(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add any additional configuration if needed
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Export the admin instance for use in other modules
export default admin;
