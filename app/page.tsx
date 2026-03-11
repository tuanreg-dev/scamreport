"use client";

import { FormEvent, useState } from "react";
import {
  CONTENT_TYPE_LABELS,
  type ContentType,
  detectContentType,
  isValidByContentType,
  normalizeByContentType
} from "@/lib/content";
import { PHONE_GROUP_LABELS, type PhoneNumberGroup } from "@/lib/phone";

type CategoryCount = {
  category: string;
  count: number;
};

type SearchResponse = {
  exists: boolean;
  contentType: ContentType;
  contentValue: string;
  totalReports: number;
  categories: CategoryCount[];
  message: string;
  phoneGroups?: PhoneNumberGroup[];
  error?: string;
};

const REPORT_CATEGORIES = ["Lừa đảo", "Spam quảng cáo", "Làm phiền", "Đòi nợ", "Khác"];
const REPORT_CONTENT_TYPES: ContentType[] = ["phone", "bank_account", "website"];

export default function HomePage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  const [reportContentType, setReportContentType] = useState<ContentType>("phone");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const fetchSearchResult = async (
    searchValue: string,
    preferredContentType?: ContentType
  ): Promise<SearchResponse> => {
    const params = new URLSearchParams({ query: searchValue });
    if (preferredContentType) {
      params.set("contentType", preferredContentType);
    }

    const response = await fetch(`/api/search?${params.toString()}`);
    const data = (await response.json()) as SearchResponse;

    if (!response.ok) {
      throw new Error(data.error ?? "Có lỗi xảy ra khi tìm kiếm.");
    }

    setSearchResult(data);
    return data;
  };

  const getSearchValidationError = (value: string): string => {
    if (!value) {
      return "Vui lòng nhập nội dung cần tìm kiếm.";
    }

    if (!detectContentType(value)) {
      return "Nội dung không hợp lệ. Hỗ trợ: số điện thoại, số tài khoản ngân hàng hoặc link website.";
    }

    return "";
  };

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchError("");
    setSearchResult(null);
    setReportError("");
    setReportSuccess("");
    setSelectedCategories([]);

    const searchValue = searchInput.trim();
    const searchValidationError = getSearchValidationError(searchValue);
    if (searchValidationError) {
      setSearchError(searchValidationError);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await fetchSearchResult(searchValue);
      if (!result.exists) {
        setReportContentType(result.contentType);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể kết nối máy chủ. Vui lòng thử lại.";
      setSearchError(message);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportError("");
    setReportSuccess("");

    const searchValue = searchInput.trim();
    if (!searchValue) {
      setReportError("Vui lòng nhập nội dung cần báo cáo.");
      return;
    }

    const normalizedContent = normalizeByContentType(searchValue, reportContentType);
    if (!isValidByContentType(normalizedContent, reportContentType)) {
      setReportError("Nội dung không hợp lệ với loại đã chọn. Vui lòng kiểm tra lại.");
      return;
    }

    if (selectedCategories.length === 0) {
      setReportError("Vui lòng chọn ít nhất một danh mục báo cáo.");
      return;
    }

    setReportLoading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: searchValue,
          contentType: reportContentType,
          categories: selectedCategories
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setReportError(data.error ?? "Không thể gửi báo cáo.");
        return;
      }

      setReportSuccess(data.message ?? "Báo cáo đã được gửi thành công.");
      setSelectedCategories([]);
      await fetchSearchResult(searchValue, reportContentType);
    } catch {
      setReportError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur md:p-8">
        <h1 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
          Tra cứu & Báo cáo nội dung xấu
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600 md:text-base">
          Hỗ trợ tra cứu số điện thoại, số tài khoản ngân hàng và link website giả mạo.
        </p>

        <form onSubmit={submitSearch} className="mt-6 space-y-4">
          <div>
            <label htmlFor="search-phone" className="mb-2 block text-sm font-medium text-slate-800">
              Nội dung cần tìm kiếm
            </label>
            <input
              id="search-phone"
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ví dụ: 0901234567, 123456789, abc-def.com/login"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {searchLoading ? "Đang tìm kiếm..." : "Tìm kiếm"}
          </button>
        </form>

        {searchError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchError}
          </p>
        ) : null}

        {searchResult ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{searchResult.message}</p>
            <p className="mt-2 text-sm text-slate-700">
              Loại nội dung: <span className="font-semibold">{CONTENT_TYPE_LABELS[searchResult.contentType]}</span>
            </p>
            <p className="text-sm text-slate-700">
              {searchResult.contentType === "phone" ? "Số điện thoại" : "Giá trị chuẩn hóa"}:{" "}
              <span className="font-semibold">{searchResult.contentValue}</span>
            </p>
            {searchResult.contentType === "phone" && searchResult.phoneGroups && searchResult.phoneGroups.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-slate-600">Phân loại:</span>
                {searchResult.phoneGroups.map((group) => (
                  <span
                    key={group}
                    className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                  >
                    {PHONE_GROUP_LABELS[group]}
                  </span>
                ))}
              </div>
            ) : null}
            {searchResult.exists ? (
              <>
                <p className="mt-2 text-sm text-slate-700">
                  Tổng số báo cáo: <span className="font-semibold">{searchResult.totalReports}</span>
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {searchResult.categories.map((item) => (
                    <li
                      key={item.category}
                      className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                    >
                      <span>{item.category}</span>
                      <span className="font-semibold">{item.count} lần</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <form onSubmit={submitReport} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-700">
                  Nội dung này chưa có báo cáo. Hãy chọn loại nội dung và danh mục để gửi báo cáo.
                </p>
                <p className="text-xs text-slate-500">
                  Nếu hệ thống nhận dạng chưa đúng, bạn có thể chọn lại loại nội dung trước khi gửi.
                </p>

                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-slate-800">Loại nội dung</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {REPORT_CONTENT_TYPES.map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                      >
                        <input
                          type="radio"
                          name="report-content-type"
                          checked={reportContentType === type}
                          onChange={() => setReportContentType(type)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        {CONTENT_TYPE_LABELS[type]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-slate-800">Danh mục báo cáo</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {REPORT_CATEGORIES.map((category) => (
                      <label
                        key={category}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={reportLoading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {reportLoading ? "Đang gửi..." : "Xác nhận báo cáo"}
                </button>
              </form>
            )}
          </div>
        ) : null}

        {reportError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {reportError}
          </p>
        ) : null}
        {reportSuccess ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {reportSuccess}
          </p>
        ) : null}
      </section>
    </main>
  );
}
