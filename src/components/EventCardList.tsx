import { TEvents } from "@/types/events";
import { EventCard } from "./EventCard";

interface EventCardListProps {
  eventsData: TEvents[];
}

export function EventCardList({ eventsData = [] }: EventCardListProps) {
  return (
    <div className="flex overflow-x-auto scroll-smooth thin-scrollbar space-x-4">
      {eventsData.map((data, i) => (
        <EventCard key={i} data={data} priority={i < 2} />
      ))}
    </div>
  );
}
