import db from './db';

export function getPublicArtWorkSlugs() {
  const stmt = db.prepare('SELECT slug FROM public_art_works');
  return stmt.all().map((row) => row.slug);
}

export function getPublicArtWorksTimeline() {
  const stmt = db.prepare(
    `SELECT slug, title, year
     FROM public_art_works
     ORDER BY CAST(year AS INTEGER) DESC, slug ASC`
  );

  return stmt.all();
}

export function getPublicArtWorkBySlug(slug) {
  const stmt = db.prepare(
    `SELECT slug, title, medium, size, year, location, management, description, hero_image
     FROM public_art_works
     WHERE slug = ?`
  );

  return stmt.get(slug);
}
