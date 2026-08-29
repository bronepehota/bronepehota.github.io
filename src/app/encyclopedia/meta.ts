/**
 * Title/description shared by the encyclopedia layout metadata and the
 * /encyclopedia page's own openGraph (og:url) object — the page-level OG set
 * must restate them because it replaces the root-layout openGraph entirely.
 *
 * Lives in a separate module: Next 14 route files (layout/page) only allow
 * route-specific exports (default/metadata/generateStaticParams/…), so the
 * consts can't be exported from layout.tsx directly.
 */
export const ENCYCLOPEDIA_TITLE = 'Энциклопедия — Бронепехота';
export const ENCYCLOPEDIA_DESCRIPTION = 'Полный справочник по отрядам и технике Бронепехоты';
