export function normalizePhoneNumber(value: string): string {
  const cleaned = value.trim().replace(/[\s().-]+/g, "");

  if (cleaned.startsWith("+84")) {
    return `0${cleaned.slice(3)}`;
  }

  if (/^84\d{8,10}$/.test(cleaned)) {
    return `0${cleaned.slice(2)}`;
  }

  return cleaned;
}

export function isValidVietnamPhoneNumber(value: string): boolean {
  const mobilePattern = /^0(?:3|5|7|8|9)\d{8}$/;
  const landlinePattern = /^02\d{8,9}$/;
  const hotlinePattern = /^(?:1800|1900)\d{4}$/;

  return mobilePattern.test(value) || landlinePattern.test(value) || hotlinePattern.test(value);
}
