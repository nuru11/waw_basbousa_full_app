const FOOD_IMG_BASE = "/food_img";
export const DEFAULT_DISH_IMAGE = `${FOOD_IMG_BASE}/default.svg`;

export function dishImageSlug(dishName: string): string {
  return dishName.toLowerCase().trim().replace(/\s+/g, "");
}

export function dishImageUrl(dishName: string): string {
  return `${FOOD_IMG_BASE}/${dishImageSlug(dishName)}.png`;
}
