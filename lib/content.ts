import { isValidVietnamPhoneNumber, normalizePhoneNumber } from "@/lib/phone";

export type ContentType = "phone" | "bank_account" | "website";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  phone: "Số điện thoại",
  bank_account: "Số tài khoản ngân hàng",
  website: "Link website"
};

function normalizeBankAccount(value: string): string {
  return value.trim().replace(/[\s.-]+/g, "");
}

function isValidBankAccount(value: string): boolean {
  return /^\d{6,19}$/.test(value);
}

function normalizeWebsite(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) {
      return "";
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    const normalizedPath = pathname === "" ? "" : pathname;
    return `${url.hostname}${normalizedPath}${url.search}`;
  } catch {
    return "";
  }
}

function isValidWebsite(value: string): boolean {
  return value !== "";
}

export function normalizeByContentType(rawValue: string, contentType: ContentType): string {
  if (contentType === "phone") {
    return normalizePhoneNumber(rawValue);
  }
  if (contentType === "bank_account") {
    return normalizeBankAccount(rawValue);
  }

  return normalizeWebsite(rawValue);
}

export function isValidByContentType(normalizedValue: string, contentType: ContentType): boolean {
  if (contentType === "phone") {
    return isValidVietnamPhoneNumber(normalizedValue);
  }
  if (contentType === "bank_account") {
    return isValidBankAccount(normalizedValue);
  }

  return isValidWebsite(normalizedValue);
}

export function detectContentType(rawValue: string): { contentType: ContentType; contentValue: string } | null {
  const phoneValue = normalizeByContentType(rawValue, "phone");
  if (isValidByContentType(phoneValue, "phone")) {
    return { contentType: "phone", contentValue: phoneValue };
  }

  const bankValue = normalizeByContentType(rawValue, "bank_account");
  if (isValidByContentType(bankValue, "bank_account")) {
    return { contentType: "bank_account", contentValue: bankValue };
  }

  const websiteValue = normalizeByContentType(rawValue, "website");
  if (isValidByContentType(websiteValue, "website")) {
    return { contentType: "website", contentValue: websiteValue };
  }

  return null;
}

