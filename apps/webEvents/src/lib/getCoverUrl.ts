/**
 * Generates a deterministic cover image URL based on event title and category.
 * Uses picsum.photos with a seed for consistent results per event.
 */
export function getCoverUrl(
  title: string,
  category: string,
  size: { width: number; height: number } = { width: 600, height: 600 },
): string {
  const seed = encodeURIComponent(`${title}-${category}`.toLowerCase());
  return `https://picsum.photos/seed/${seed}/${size.width}/${size.height}`;
}
