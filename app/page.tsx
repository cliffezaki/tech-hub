import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Smartphone, Bot } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getHomepageReviews, getSectionArticles } from "@/lib/content";

export default async function Home() {
  const smartphoneReviews = await getHomepageReviews();
  const trendingNews = (await getSectionArticles("news")).slice(0, 3);

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden border-b bg-muted/40">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col gap-6 md:max-w-3xl">
            <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
              <Bot className="h-4 w-4" />
              <span>Breaking AI News</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl leading-[1.1]">
              The Singularity <br className="hidden md:block" /> is Nearer Than You Think.
            </h1>
            <p className="max-w-2xl text-xl text-muted-foreground md:text-2xl">
              New reasoning models are shattering benchmarks. We dive deep into what this means for humanity, code, and creativity.
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="rounded-full text-base">
                Read the Deep Dive <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -z-10 h-full w-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-background to-background"></div>
      </section>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">

          {/* Smartphone Reviews - Main Feed (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight font-[family-name:var(--font-playfair)]">
                <Smartphone className="h-6 w-6" /> Smartphone Reviews
              </h2>
              <Link href="/reviews" className="text-sm font-medium hover:underline text-muted-foreground">
                View all
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {smartphoneReviews.map((review) => (
                <Card key={review.id} className="group overflow-hidden border-0 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  {/* Featured Image */}
                  <div className="aspect-video w-full bg-muted/50 group-hover:bg-muted/70 transition-colors relative overflow-hidden">
                    {review.imageUrl ? (
                      <Image
                        src={review.imageUrl}
                        alt={review.title}
                        fill
                        unoptimized
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                        <Smartphone className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{review.category}</span>
                      <span>{new Date(review.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="text-xl decoration-2 underline-offset-4 hover:underline transition-colors font-[family-name:var(--font-playfair)]">
                      <Link href={`/reviews/${review.slug}`}>{review.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">{review.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar - Trending AI (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border-l pl-8 space-y-8">
              <div className="border-b pb-4">
                <h3 className="text-xl font-bold tracking-tight font-[family-name:var(--font-playfair)]">Trending in AI</h3>
              </div>
              <div className="flex flex-col gap-6">
                {trendingNews.map((news) => (
                  <Link key={news.id} href={`/news/${news.slug}`} className="group block space-y-2">
                    <div className="text-xs font-semibold uppercase text-brand-red">Hot Topic</div>
                    <h4 className="text-lg font-bold leading-tight transition-colors hover:underline font-[family-name:var(--font-playfair)]">
                      {news.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {news.excerpt}
                    </p>
                  </Link>
                ))}
              </div>

              {/* Newsletter Box */}
              <div className="mt-8 rounded-lg bg-primary p-6 text-primary-foreground">
                <h4 className="text-lg font-bold mb-2 font-[family-name:var(--font-playfair)]">Tech Hub Weekly</h4>
                <p className="text-sm opacity-90 mb-4">Get the future in your inbox. No spam, just signal.</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Email" className="w-full rounded bg-primary-foreground/10 px-3 py-2 text-sm placeholder:text-primary-foreground/50 border border-primary-foreground/20 focus:outline-none focus:ring-1 focus:ring-primary-foreground" />
                  <Button variant="secondary" size="sm">Join</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
