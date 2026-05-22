/**
 * Datetime utilities for NARI.
 * Handles the "Store in UTC, Display in Local" protocol.
 */
import { parseISO } from 'date-fns';
import { useUiStore } from '../store/uiStore';

/**
 * Returns a new Date object synchronized with the server's atomic clock.
 * Uses the timeOffset calculated during the handshake.
 */
export const getNeuralTime = () => {
  const localTime = new Date().getTime();
  const offset = useUiStore.getState().timeOffset || 0;
  return new Date(localTime + offset);
};

/**
 * Parses an ISO string from the backend and ensures it is treated as UTC.
 * If the string lacks a 'Z' or offset, it appends 'Z' to force UTC parsing.
 * 
 * @param {string} isoString - The ISO string from the backend (e.g., "2026-05-22T16:24:00")
 * @returns {Date} - A JavaScript Date object in local browser time.
 */
export const parseUTC = (isoString) => {
  if (!isoString) return new Date();
  
  // If it already has a timezone indicator, parse normally
  if (isoString.includes('Z') || isoString.includes('+') || (isoString.match(/-/g) || []).length > 2) {
     return parseISO(isoString);
  }
  
  // Otherwise, force UTC interpretation
  return parseISO(`${isoString}Z`);
};

/**
 * Formats a Date object or ISO string into a local readable time.
 */
export const formatLocal = (dateOrString, formatStr, options = {}) => {
  const date = typeof dateOrString === 'string' ? parseUTC(dateOrString) : dateOrString;
  // Note: we would normally import 'format' from date-fns here, 
  // but to keep this util lean, we'll let the components handle the formatting 
  // after they get the local Date object from parseUTC.
  return date;
};
