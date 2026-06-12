import { nanoid } from "nanoid";

const DEVICE_ID_KEY = "mbr_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = nanoid();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}
