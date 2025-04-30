import BackButton from "@/components/BackButton";
import Image from "next/image";

export default function IdentSlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="min-h-[100svh] grid lg:grid-cols-[1fr_2fr] items-center bg-[#007057]">
        <div className="hidden lg:block h-full relative">
          {/* Background Image */}
          <Image
            src="/images/pig-farming.jpg"
            alt="Pig farming background"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {/* Green overlay to maintain theme */}
          <div className="absolute inset-0 bg-[#007057] bg-opacity-50" />

          {/* Add logo */}
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-3">
              <Image
                src="/agri-advice-logo.png"
                alt="Agri-Advice Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md text-center">
              AgriAdvice
            </h1>
            <p className="text-white/90 mt-2 max-w-md mx-auto text-sm text-center">
              Combining Manual Expertise and AI Translator for Optimal Piggery
              Consultancy
            </p>
          </div>

          <div className="absolute inset-0 flex items-end justify-center z-20 pb-5">
            <BackButton />
          </div>
        </div>
        <div className="h-full bg-white lg:rounded-l-3xl">{children}</div>
      </main>
    </>
  );
}
