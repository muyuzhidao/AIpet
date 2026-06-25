import { AppFrame, FeaturedModule } from "../components";

export const dynamic = "force-dynamic";

export default async function FeaturedPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <AppFrame active="featured" filters={{ featuredCategory: category }}>
      <FeaturedModule category={category} />
    </AppFrame>
  );
}
