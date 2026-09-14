import { AccessGate } from "@/components/access-gate";

export default async function Home({ searchParams }: { searchParams: Promise<{ invalid?: string }> }) {
  const { invalid } = await searchParams;
  return <AccessGate invalidLink={invalid === "1"} />;
}
