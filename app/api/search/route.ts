import { NextRequest, NextResponse } from "next/server";
import { getReportStats } from "@/lib/db";
import {
  CONTENT_TYPE_LABELS,
  type ContentType,
  detectContentType,
  isValidByContentType,
  normalizeByContentType
} from "@/lib/content";
import { classifyPhoneNumberGroups, type PhoneNumberGroup } from "@/lib/phone";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const queryParam = request.nextUrl.searchParams.get("query") ?? request.nextUrl.searchParams.get("phone") ?? "";
    const requestedType = request.nextUrl.searchParams.get("contentType") as ContentType | null;
    const normalizedQuery = queryParam.trim();

    if (!normalizedQuery) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung cần tìm kiếm." },
        { status: 400 }
      );
    }

    let detected = detectContentType(normalizedQuery);

    if (requestedType && ["phone", "bank_account", "website"].includes(requestedType)) {
      const normalizedValue = normalizeByContentType(normalizedQuery, requestedType);
      if (isValidByContentType(normalizedValue, requestedType)) {
        detected = {
          contentType: requestedType,
          contentValue: normalizedValue
        };
      }
    }

    if (!detected) {
      return NextResponse.json(
        {
          error:
            "Nội dung không hợp lệ. Hỗ trợ tìm kiếm: số điện thoại, số tài khoản ngân hàng hoặc link website."
        },
        { status: 400 }
      );
    }

    const stats = await getReportStats(detected.contentType, detected.contentValue);
    const contentLabel = CONTENT_TYPE_LABELS[detected.contentType];

    const basePayload = {
      contentType: detected.contentType,
      contentValue: detected.contentValue,
      categories: stats.totalReports > 0 ? stats.categories : []
    };

    if (detected.contentType === "phone") {
      const phoneGroups: PhoneNumberGroup[] = classifyPhoneNumberGroups(detected.contentValue, {
        reported: stats.totalReports > 0
      });
      Object.assign(basePayload, { phoneGroups });
    }

    if (stats.totalReports === 0) {
      return NextResponse.json({
        exists: false,
        ...basePayload,
        totalReports: 0,
        message: `${contentLabel} này chưa bị báo cáo.`
      });
    }

    return NextResponse.json({
      exists: true,
      ...basePayload,
      totalReports: stats.totalReports,
      message: `${contentLabel} này đã bị báo cáo ${stats.totalReports} lần.`
    });
  } catch {
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
