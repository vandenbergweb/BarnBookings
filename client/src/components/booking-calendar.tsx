import { Calendar } from "@/components/ui/calendar";

interface BookingCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isDateDisabled?: (date: Date) => boolean;
}

export default function BookingCalendar({ selectedDate, onDateChange, isDateDisabled }: BookingCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fourMonthsFromNow = new Date(today);
  fourMonthsFromNow.setMonth(today.getMonth() + 4);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && onDateChange(date)}
      disabled={(date) => {
        if (date < today || date > fourMonthsFromNow) return true;
        if (isDateDisabled && isDateDisabled(date)) return true;
        return false;
      }}
      className="rounded-md border"
      data-testid="calendar-booking"
    />
  );
}
