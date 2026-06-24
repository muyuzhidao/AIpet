import { AllNewsModule, AppFrame } from "../components";

export default async function AllNewsPage({
  searchParams
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;

  return (
    <AppFrame active="all-news" filters={{ newsSource: source }}>
      <AllNewsModule source={source} />
    </AppFrame>
  );
}
