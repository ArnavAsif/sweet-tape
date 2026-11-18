import type { Metadata } from "next";
import PickPlayerSection from "@/components/PickPlayerSection";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Our Family — Six Tapes, One for Every Job | SweetTape",
  description:
    "Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks.",
  openGraph: {
    title: "Our Family — Six Tapes, One for Every Job | SweetTape",
    description:
      "Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks.",
    url: "https://sweet-tape.com/products",
  },
};

export default function ProductsPage() {
  return (
    <>
      <PickPlayerSection />
      <SiteFooter />
    </>
  );
}
