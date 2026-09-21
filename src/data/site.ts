// 사이트명은 한 곳에서만 관리합니다. SEO 제목/og:site_name/브랜드 표기 모두 이 값을 사용합니다.
// 형식: 「관광지 이름 + 도시 + 여행 안내」
export const SITE_NAME = '대전중앙시장 대전 여행 안내';

// 하위 페이지 제목에 사이트명을 ' | ' 접미사로 붙입니다.
export function withSiteName(title: string): string {
  return `${title} | ${SITE_NAME}`;
}
