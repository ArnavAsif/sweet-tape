import type { Metadata } from "next";
import AboutHero from "@/components/AboutHero";
import ConveyorSection from "@/components/ConveyorSection";
import ReasonSection from "@/components/ReasonSection";

export const metadata: Metadata = {
  title: "About SweetTape — Three Generations of Tape, One Face",
  description:
    "Three generations of tape. We wanted to be clearer, easier to choose, recognisable and more human — the same tape as always, finally with a face.",
  openGraph: {
    title: "About SweetTape — Three Generations of Tape, One Face",
    description:
      "Three generations of tape. We wanted to be clearer, easier to choose, recognisable and more human — the same tape as always, finally with a face.",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <ConveyorSection />
      <ReasonSection />
    </>
  );
}
