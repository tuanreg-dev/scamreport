import { NextRequest, NextResponse } from "next/server";
import { addReports } from "@/lib/db";
import {
  CONTENT_TYPE_LABELS,
  type ContentType,
  isValidByContentType,
  normalizeByContentType
} from "@/lib/content";

type ReportPayload = {
  content?: string;
  contentType?: ContentType;
  categories?: string[];
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await request.json()) as ReportPayload;
    const contentType = payload.contentType;
    const normalizedContent = normalizeByContentType(payload.content ?? "", contentType ?? "phone");
    const categories = Array.isArray(payload.categories)
      ? payload.categories.filter((item) => typeof item === "string" && item.trim() !== "")
      : [];

    if (!contentType || !["phone", "bank_account", "website"].includes(contentType)) {
      return NextResponse.json(
        { error: "Vui lòng chọn loại nội dung cần báo cáo." },
        { status: 400 }
      );
    }

    if (!normalizedContent) {
      return NextResponse.json(
        { error: `Vui lòng nhập ${CONTENT_TYPE_LABELS[contentType].toLowerCase()} cần báo cáo.` },
        { status: 400 }
      );
    }

    if (!isValidByContentType(normalizedContent, contentType)) {
      return NextResponse.json(
        {
          error:
            "Nội dung không hợp lệ với loại đã chọn. Vui lòng kiểm tra lại số điện thoại, số tài khoản hoặc link website."
        },
        { status: 400 }
      );
    }

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất một danh mục báo cáo." },
        { status: 400 }
      );
    }

    await addReports(contentType, normalizedContent, categories);

    return NextResponse.json({
      success: true,
      message: "Báo cáo đã được gửi thành công."
    });
  } catch (error) {
    console.error("POST /api/report failed", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? "Không thể gửi báo cáo. Vui lòng thử lại và kiểm tra log server."
            : "Không thể gửi báo cáo. Vui lòng thử lại."
      },
      { status: 500 }
    );
  }
}
