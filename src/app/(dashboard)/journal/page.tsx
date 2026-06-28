import { JournalPage } from "./JournalPage";

export const dynamic = "force-dynamic";

export default async function Journal(props: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const searchParams = await props.searchParams;
  return <JournalPage initialDate={searchParams?.date} />;
}
