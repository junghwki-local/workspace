import { test, expect } from "@playwright/test";

test.describe("블로그 목록 페이지", () => {
  test("/ 접속 시 /blog로 리다이렉트된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/blog/);
  });

  test("블로그 목록이 표시된다", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/Blog/);
    // 글 카드 또는 빈 상태 중 하나가 보여야 함
    const hasCards = await page.locator("article").count();
    const hasEmpty = await page.getByText("게시글이 없습니다.").count();
    expect(hasCards + hasEmpty).toBeGreaterThan(0);
  });

  test("검색어 입력 시 URL에 반영된다", async ({ page }) => {
    await page.goto("/blog");
    const searchInput = page.getByRole("textbox");
    if (await searchInput.count() > 0) {
      await searchInput.fill("테스트");
      await searchInput.press("Enter");
      await expect(page).toHaveURL(/search=테스트/);
    }
  });
});

test.describe("영문 로케일", () => {
  test("/en/blog 접속 시 영문 페이지가 표시된다", async ({ page }) => {
    await page.goto("/en/blog");
    await expect(page).toHaveURL(/\/en\/blog/);
    await expect(page).toHaveTitle(/Blog/);
  });
});

test.describe("SEO / 메타데이터", () => {
  test("블로그 페이지에 메타 description이 있다", async ({ page }) => {
    await page.goto("/blog");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
  });

  test("sitemap.xml이 접근 가능하다", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("robots.txt가 접근 가능하다", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("feed.xml이 접근 가능하다", async ({ page }) => {
    const response = await page.goto("/feed.xml");
    expect(response?.status()).toBe(200);
  });
});

test.describe("API", () => {
  test("OG 이미지 API가 응답한다", async ({ request }) => {
    const response = await request.get("/api/og?title=Test&description=Hello&category=Dev");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });
});
