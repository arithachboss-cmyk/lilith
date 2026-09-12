import { PilotInbox } from "@/src/components/pilot/journey";
import "../pilot.css";
export const metadata = {
  title: "Middle Property | Operations Inbox",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PilotInbox />;
}
