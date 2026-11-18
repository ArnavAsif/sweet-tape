import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProductSlugs } from "@/data/products";
import ProductIntroSection from "@/components/ProductIntroSection";
import ProductInnerInfoSection from "@/components/ProductInnerInfoSection";
import SiblingsSection from "@/components/SiblingsSection";
import NextUpSection from "@/components/NextUpSection";
import SiteFooter from "@/components/SiteFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  const name = product.productName || product.title;
  return {
    title: `${name} — SweetTape`,
    description: product.story,
    openGraph: {
      title: `${name} — SweetTape`,
      description: product.story,
      url: `https://sweet-tape.com/products/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductIntroSection product={product} />
      <ProductInnerInfoSection product={product} />
      <SiblingsSection product={product} />
      <NextUpSection product={product} />
      <SiteFooter />
    </>
  );
}
