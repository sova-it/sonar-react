import axios from "axios";
import { Platform } from "react-native";

/**
 * - Development (npm start/npx expo start): Uses EXPO_PUBLIC_API_URL from .env, no /api prefix
 * - Production web (Docker): Uses /api prefix 
 * - Production native: Uses EXPO_PUBLIC_API_URL baked in at build time, no /api prefix
 */

function getBaseURL(): string {
  if (__DEV__) {
    // dev mode
    return process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";
  }

  if (Platform.OS === "web") {
    // Production web
    return "/api";
  }

  // Production native
  return process.env.EXPO_PUBLIC_API_URL || "";
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
