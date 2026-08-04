/**
 * Route map preserved from R25's 13-route information architecture
 * (docs/legacy/r25-ui-inventory.md §1 — must remain reachable with the
 * same names per the visual fidelity contract).
 */
export const ROUTES = {
  home: '/',
  about: '/gioi-thieu',
  schedule: '/lich-thi-dau',
  results: '/ket-qua',
  standings: '/bang-xep-hang',
  statistics: '/thong-ke',
  teams: '/doi',
  team: (slug: string) => `/doi/${slug}`,
  players: '/cau-thu',
  playerCompare: '/cau-thu/so-sanh',
  player: (slug: string | number) => `/cau-thu/${slug}`,
  match: (id: string | number) => `/tran-dau/${id}`,
  predictions: '/du-doan',
  livestream: '/livestream',
  honors: '/vinh-danh',
  gallery: '/thu-vien',
  rules: '/dieu-le',
  sponsor: '/tai-tro',
  contact: '/lien-he',
  admin: '/admin',
  login: '/dang-nhap',
} as const;
