import Link from "next/link";
import { Button } from "@heroui/button";

import { title, subtitle } from "@/components/primitives";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10 min-h-[60vh]">
      <div className="inline-block max-w-3xl text-center justify-center">
        <div className="mb-6">
          <span className={title({ size: "lg" })}>404&nbsp;</span>
          <br />
          <span className={title({ size: "lg", color: "yellow" })}>
            Page Not Found
          </span>
        </div>
        <div className={subtitle({ class: "mt-4 max-w-2xl" })}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/en">
          <Button color="primary" size="lg" variant="shadow">
            Go Home (English)
          </Button>
        </Link>
        <Link href="/fr">
          <Button color="primary" size="lg" variant="bordered">
            Accueil (Français)
          </Button>
        </Link>
      </div>
    </section>
  );
}
