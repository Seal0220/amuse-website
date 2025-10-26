import db from './db';

export function getPublicArtWorkSlugs() {
  const stmt = db.prepare(
    `SELECT slug
     FROM public_art_works
     ORDER BY slug ASC`,
  );

  return stmt.all().map((row) => row.slug);
}

export function getPublicArtWorksTimeline() {
  const stmt = db.prepare(
    `SELECT slug, title, year
     FROM public_art_works
     ORDER BY CAST(year AS INTEGER) DESC, slug ASC`,
  );

  const rows = stmt.all();

  const grouped = new Map();
  rows.forEach((row) => {
    const yearKey = row.year ?? 'N/A';
    if (!grouped.has(yearKey)) {
      grouped.set(yearKey, []);
    }

    grouped.get(yearKey).push({
      slug: row.slug,
      title: row.title,
      year: row.year,
    });
  });

  const sortedYears = Array.from(grouped.keys()).sort((a, b) => {
    const aNum = Number.parseInt(a, 10);
    const bNum = Number.parseInt(b, 10);

    const aIsNumber = Number.isFinite(aNum);
    const bIsNumber = Number.isFinite(bNum);

    if (aIsNumber && bIsNumber) {
      return bNum - aNum;
    }

    if (aIsNumber) return -1;
    if (bIsNumber) return 1;

    return String(a).localeCompare(String(b));
  });

  return sortedYears.map((year) => ({
    year,
    works: grouped.get(year) ?? [],
  }));
}

export function getPublicArtWorkBySlug(slug) {
  const stmt = db.prepare(
    `SELECT slug, title, medium, size, year, location, management, description, hero_image
     FROM public_art_works
     WHERE slug = ?`,
  );

  return stmt.get(slug);
}
