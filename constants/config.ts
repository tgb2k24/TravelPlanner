// Use your local IP for development (e.g., 'http://192.168.1.5:8000')
// Use your Render/Production URL for release (e.g., 'https://travel-planner-api.onrender.com')

const ENV: string = 'dev'; // Change to 'prod' before building APK

const LOCAL_API_URL = 'http://10.108.127.154:8000'; // YOUR LOCAL IP
const PROD_API_URL = ''; // ADD YOUR RENDER URL HERE after deployment

export const API_URL = ENV === 'prod' ? PROD_API_URL : LOCAL_API_URL;
// Google Sign-In Web Client ID associated with the Firebase project
export const GOOGLE_WEB_CLIENT_ID = '1014371558302-pu9tg0hal59frc7eqqfm8v06tid6slf5.apps.googleusercontent.com';
