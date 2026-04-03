import { describe, it, expect } from "vitest";
import { formatDate, stripHtml, sanitizeContent, getCategoryColor } from "@/lib/utils";

describe("formatDate", () => {
  it("ISO 날짜 문자열을 한국어 형식으로 변환한다", () => {
    const result = formatDate("2024-01-15T00:00:00");
    expect(result).toBe("2024년 1월 15일");
  });

  it("다른 날짜도 올바르게 변환한다", () => {
    const result = formatDate("2023-12-31T00:00:00");
    expect(result).toBe("2023년 12월 31일");
  });
});

describe("stripHtml", () => {
  it("HTML 태그를 전부 제거한다", () => {
    expect(stripHtml("<p>안녕하세요</p>")).toBe("안녕하세요");
  });

  it("중첩 태그도 제거한다", () => {
    expect(stripHtml("<h1><strong>제목</strong></h1>")).toBe("제목");
  });

  it("빈 문자열에 대해 빈 문자열을 반환한다", () => {
    expect(stripHtml("")).toBe("");
  });

  it("태그 없는 텍스트는 그대로 반환한다", () => {
    expect(stripHtml("일반 텍스트")).toBe("일반 텍스트");
  });
});

describe("sanitizeContent", () => {
  it("허용된 태그는 유지한다", () => {
    const result = sanitizeContent("<p>내용</p>");
    expect(result).toContain("<p>내용</p>");
  });

  it("script 태그를 제거한다", () => {
    const result = sanitizeContent('<script>alert("xss")</script><p>내용</p>');
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>내용</p>");
  });

  it("onclick 같은 이벤트 핸들러를 제거한다", () => {
    const result = sanitizeContent('<p onclick="evil()">내용</p>');
    expect(result).not.toContain("onclick");
  });

  it("img 태그와 src 속성을 허용한다", () => {
    const result = sanitizeContent('<img src="https://example.com/img.jpg" alt="이미지">');
    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/img.jpg"');
  });
});

describe("getCategoryColor", () => {
  it("알려진 slug에 대해 올바른 색상을 반환한다", () => {
    expect(getCategoryColor("dev", "")).toBe("bg-red-600");
    expect(getCategoryColor("개발", "")).toBe("bg-red-600");
    expect(getCategoryColor("gear", "")).toBe("bg-yellow-400");
    expect(getCategoryColor("여행", "")).toBe("bg-blue-600");
  });

  it("알려진 name에 대해 올바른 색상을 반환한다", () => {
    expect(getCategoryColor("unknown-slug", "개발")).toBe("bg-red-600");
  });

  it("알 수 없는 카테고리는 기본 색상을 반환한다", () => {
    expect(getCategoryColor("xyz", "xyz")).toBe("bg-zinc-700");
  });
});
