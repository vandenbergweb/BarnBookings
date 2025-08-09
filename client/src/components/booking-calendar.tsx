import { Calendar } from "@/components/ui/calendar";

interface BookingCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function BookingCalendar({ selectedDate, onDateChange }: BookingCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && onDateChange(date)}
      disabled={(date) => date < today}
      className="rounded-md border"
      data-testid="calendar-booking"
    />
  );
}
