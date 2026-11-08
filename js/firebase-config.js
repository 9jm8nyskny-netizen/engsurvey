// إعدادات مشروع Firebase: engsurvey
export const firebaseConfig = {
  apiKey: "AIzaSyATB2rgdKMVrHkQRT6kwa_d7YTnAVCkNP4",
  authDomain: "engsurvey-10d17.firebaseapp.com",
  projectId: "engsurvey-10d17",
  storageBucket: "engsurvey-10d17.firebasestorage.app",
  messagingSenderId: "205577670453",
  appId: "1:205577670453:web:75aba699dfdce584b9467c",
  measurementId: "G-LE0E3FNWGX",
};

// حسابات Google المسموح لها بحذف الردود من صفحة التجميع
// (لازم تكون نفس القائمة الموجودة في firestore.rules)
export const ADMIN_EMAILS = ["ramadanazzan857@gmail.com"];
