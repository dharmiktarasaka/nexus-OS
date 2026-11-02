import { getAuth, FacebookAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { app, auth as mainAuth, DEFAULT_FIREBASE_CONFIG } from '../../firebase/config';

let auth = mainAuth;
let facebookProvider = null;
let googleProvider = null;

try {
  facebookProvider = new FacebookAuthProvider();
  facebookProvider.addScope('pages_manage_posts');
  facebookProvider.addScope('pages_read_engagement');
  facebookProvider.addScope('instagram_basic');
  facebookProvider.addScope('instagram_content_publish');
  facebookProvider.addScope('pages_show_list');

  googleProvider = new GoogleAuthProvider();
} catch (e) {
  // Provider fallback
}

export { auth, facebookProvider, googleProvider, DEFAULT_FIREBASE_CONFIG as hasFirebaseConfig };
