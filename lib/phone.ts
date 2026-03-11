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

export type PhoneNumberGroup = "high_risk" | "foreign" | "reported";

export const PHONE_GROUP_LABELS: Record<PhoneNumberGroup, string> = {
  high_risk: "Nguy cơ cao",
  foreign: "Đầu số quốc tế",
  reported: "Đã bị báo cáo"
};

/**
 * Classify a phone number into business groups.
 *
 * - "high_risk": starts with 1900, 028, or 024 (after normalization).
 * - "foreign": does not use Vietnamese prefixes (+84, 84, or 0).
 * - "reported": explicitly marked as already reported.
 */
export function classifyPhoneNumberGroups(
  rawValue: string,
  options?: { reported?: boolean }
): PhoneNumberGroup[] {
  const groups: PhoneNumberGroup[] = [];
  const normalized = normalizePhoneNumber(rawValue);

  // High-risk group: numbers starting with 1900, 028, or 024
  if (
    normalized.startsWith("1900") ||
    normalized.startsWith("028") ||
    normalized.startsWith("024")
  ) {
    groups.push("high_risk");
  }

  // Foreign number group: numbers that do not use Vietnamese prefixes
  // (0... mobile/landline, 1900/1800 hotlines — these are not converted to 0... by normalizePhoneNumber)
  const usesVietnamPrefix =
    normalized.startsWith("0") ||
    normalized.startsWith("1900") ||
    normalized.startsWith("1800");
  if (!usesVietnamPrefix) {
    groups.push("foreign");
  }

  // Reported group: numbers that have already been reported/flagged
  if (options?.reported) {
    groups.push("reported");
  }

  return groups;
}
