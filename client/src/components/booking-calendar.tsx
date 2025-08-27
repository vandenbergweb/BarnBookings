import { Calendar } from "@/components/ui/calendar";

interface BookingCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function BookingCalendar({ selectedDate, onDateChange }: BookingCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate 4 months from today for maximum booking date
  const fourMonthsFromNow = new Date(today);
  fourMonthsFromNow.setMonth(today.getMonth() + 4);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && onDateChange(date)}
      disabled={(date) => date < today || date > fourMonthsFromNow}
      className="rounded-md border"
      data-testid="calendar-booking"
    />
  );
}
