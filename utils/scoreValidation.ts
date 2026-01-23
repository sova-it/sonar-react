export const validateTrackScore = (
  minutes: string,
  seconds: string,
  milliseconds: string
): string[] => {
  const errors: string[] = [];
  const min = parseInt(minutes) || 0;
  const sec = parseInt(seconds) || 0;
  const ms = parseInt(milliseconds) || 0;

  // Negative number validation
  if (min < 0 || sec < 0 || ms < 0) {
    errors.push('Time cannot be negative');
  }

  // Seconds range validation
  if (sec > 59) {
    errors.push('Seconds must be between 0 and 59');
  }

  // Milliseconds range validation
  if (ms > 999) {
    errors.push('Milliseconds must be between 0 and 999');
  }

  // Minimum time check (prevent 0:00.000)
  const totalSeconds = min * 60 + sec + ms / 1000;
  if (totalSeconds === 0) {
    errors.push('Time must be greater than 0');
  }

  return errors;
};

export const formatTime = (min: string, sec: string, ms: string): string => {
  const minutes = parseInt(min) || 0;
  const seconds = parseInt(sec) || 0;
  const millis = parseInt(ms) || 0;

  // Format: MM:SS.mmm or SS.mmm
  if (minutes > 0) {
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }
  return `${seconds.toString().padStart(2, '0')}.${millis
    .toString()
    .padStart(3, '0')}`;
};

export const parseTimeToMilliseconds = (timeStr: string): number => {
  // Parse "00:14.350" or "14.350" format to milliseconds
  const parts = timeStr.split(':');
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 2) {
    minutes = parseInt(parts[0]);
    seconds = parseFloat(parts[1]);
  } else {
    seconds = parseFloat(parts[0]);
  }

  return Math.round((minutes * 60 + seconds) * 1000);
};