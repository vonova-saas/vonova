import Image from "next/image";

export default function ContentSection() {
  return (
    <section className="py-16 md:py-24">
      {/* Courses LMS Part */}
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          Courses LMS
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mb-6 sm:mb-0">
            <div className="bg-linear-to-b relative rounded-2xl">
              <Image
                src="/images/vonova.png"
                className="hidden rounded-[15px] dark:block"
                alt="payments illustration dark"
                width={1207}
                height={929}
              />
            </div>
          </div>
          <div className="relative space-y-4">
            <p className="text-muted-foreground">
              Gemini is evolving to be more than just the models.{" "}
              <span className="text-accent-foreground font-bold">
                It supports an entire ecosystem
              </span>{" "}
              — from products innovate.
            </p>
            <p className="text-muted-foreground">
              It supports an entire ecosystem — from products to the APIs and
              platforms helping developers and businesses innovate
            </p>

            <div className="pt-6">
              <p>
                Using TailsUI has been like unlocking a secret design
                superpower. It&apos;s the perfect fusion of simplicity and
                versatility, enabling us to create UIs that are as stunning as
                they are user-friendly.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Problem Solving Part*/}
      <div className="py-16 md:py-24 mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          Problem Solving
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative space-y-4">
            <p className="text-muted-foreground">
              Gemini is evolving to be more than just the models.{" "}
              <span className="text-accent-foreground font-bold">
                It supports an entire ecosystem
              </span>{" "}
              — from products innovate.
            </p>
            <p className="text-muted-foreground">
              It supports an entire ecosystem — from products to the APIs and
              platforms helping developers and businesses innovate
            </p>

            <div className="pt-6">
              <p>
                Using TailsUI has been like unlocking a secret design
                superpower. It&apos;s the perfect fusion of simplicity and
                versatility, enabling us to create UIs that are as stunning as
                they are user-friendly.
              </p>
            </div>
          </div>
          <div className="relative mb-6 sm:mb-0">
            <div className="bg-linear-to-b relative rounded-2xl">
              <Image
                src="/images/vonova.png"
                className="hidden rounded-[15px] dark:block"
                alt="payments illustration dark"
                width={1207}
                height={929}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
