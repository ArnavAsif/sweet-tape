import productsData from "./productsData.json";

export interface SiblingVariant {
  style: string;
  img: string;
  alt: string;
  dots: string[];
}

export interface PowerCard {
  power: string;
  claim: string;
  desc: string;
}

export interface ProductData {
  slug: string;
  title: string;
  word: string;
  model: string;
  clarity: number;
  cardImg: string;
  introStyleStr: string;
  glyphs: string[];
  innerInfoStyle: string;
  shotImg: string;
  peelImg: string;
  note: string[];
  story: string;
  sibStyle: string;
  siblings: SiblingVariant[];
  powStyle: string;
  powerCards: PowerCard[];
  reelStyle: string;
  nextStyle: string;
  nextHref: string;
  nextLabel: string;
  nextRollImg?: string;
  productName?: string;
}

export const PRODUCTS: Record<string, ProductData> = productsData as unknown as Record<
  string,
  ProductData
>;

export function getProductBySlug(slug: string): ProductData | null {
  return PRODUCTS[slug] ?? null;
}

export function getAllProductSlugs(): string[] {
  return Object.keys(PRODUCTS);
}
