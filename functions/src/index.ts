/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Cloud Function to create a user with authentication credentials
 * This function creates both the Firebase Auth user and the Firestore user document
 */
export const createUserWithAuth = onCall(async (request) => {
  try {
    // Verify that the caller is authenticated and has admin privileges
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Get the calling user's data to verify admin privileges
    const callerDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'Admin') {
      throw new Error('Admin privileges required');
    }

    const { name, email, role, department, cedula } = request.data;

    // Validate required fields
    if (!name || !role || !cedula) {
      throw new Error('Missing required fields: name, role, cedula');
    }

    // Department is required for all roles except Admin
    if (role !== 'Admin' && !department) {
      throw new Error('Department is required for non-Admin roles');
    }

    // Generate email if not provided
    let finalEmail = email;
    if (!finalEmail || finalEmail.trim() === '') {
      const cleanName = name.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
      const namePrefix = cleanName.substring(0, 3);
      finalEmail = `${namePrefix}@soyelmejor.com`;
      logger.info(`Generated email for user: ${finalEmail}`);
    }

    // Generate password using first 3 letters of name + cedula
    const tempPassword = generatePasswordFromNameAndCedula(name, cedula);

    // Create the Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: finalEmail.toLowerCase().trim(),
      password: tempPassword,
      displayName: name.trim(),
      emailVerified: false,
    });

    logger.info(`Created Firebase Auth user: ${userRecord.uid}`, { email, name });

    // Create the Firestore user document
    const userData = {
      name: name.trim(),
      email: finalEmail.toLowerCase().trim(),
      role: role,
      department: role === 'Admin' ? null : department,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(name)}/100`,
      cedula: cedula?.trim() || null,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use the Auth UID as the document ID to maintain consistency
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    logger.info(`Created Firestore user document: ${userRecord.uid}`, userData);

    // Return success response with user info (excluding password)
    return {
      success: true,
      userId: userRecord.uid,
      email: userRecord.email,
      tempPassword: tempPassword, // Include temp password in response for admin
      message: 'User created successfully with authentication credentials'
    };

  } catch (error: any) {
    logger.error('Error creating user with auth:', error);
    
    // If we created the auth user but failed to create the Firestore doc, clean up
    if (error.authUserCreated) {
      try {
        await admin.auth().deleteUser(error.authUserCreated);
        logger.info(`Cleaned up auth user after Firestore error: ${error.authUserCreated}`);
      } catch (cleanupError) {
        logger.error('Failed to cleanup auth user:', cleanupError);
      }
    }

    throw new Error(error.message || 'Failed to create user');
  }
});

/**
 * Generate password using first 3 letters of name + cedula
 */
function generatePasswordFromNameAndCedula(name: string, cedula?: string): string {
  if (!cedula) {
    throw new Error('Cedula is required to generate password');
  }

  // Get first 3 letters of the name (remove spaces and special characters)
  const cleanName = name.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
  const namePrefix = cleanName.substring(0, 3);
  
  if (namePrefix.length < 3) {
    throw new Error('Name must contain at least 3 letters to generate password');
  }

  // Combine first 3 letters of name with cedula
  const password = namePrefix + cedula;
  
  // Validate minimum password requirements (Firebase requires at least 6 characters)
  if (password.length < 6) {
    throw new Error('Generated password is too short. Name and cedula combination must be at least 6 characters.');
  }

  logger.info(`Generated password for user: ${namePrefix}****** (${password.length} chars)`);
  
  return password;
}
