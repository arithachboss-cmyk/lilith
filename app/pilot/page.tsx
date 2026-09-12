import { PilotJourney } from "@/src/components/pilot/journey";
import "./pilot.css";
export const metadata = {
  title: "Middle Property | Property request",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PilotJourney />;
}
