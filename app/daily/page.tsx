import { AppFrame, DailyModule } from "../components";

export const dynamic = "force-dynamic";

export default function DailyPage() {
  return (
    <AppFrame active="daily">
      <DailyModule />
    </AppFrame>
  );
}
