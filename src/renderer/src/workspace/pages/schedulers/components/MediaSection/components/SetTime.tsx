// SetTime.tsx
import { RootState } from '@renderer/redux/store';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDate as setSchedulerDate, setTime as setSchedulerTime } from '@renderer/redux/slices/currentSlice';

const SetTime = ({
  date,
  setDate,
  time,
  setTime
}: {
  date?: string;
  setDate: (date: string) => void;
  time?: string;
  setTime: (time: string) => void;
}): JSX.Element => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler);
  const dispatch = useDispatch();

  // Get the current date and time plus 60 minutes in local timezone
  const now = new Date();
  now.setMinutes(now.getMinutes() + 60);

  // Format date for internal state (YYYY-MM-DD)
  const today = now.toLocaleDateString('en-CA');

  // Format time
  const futureTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Set initial date and time when component mounts
  useEffect(() => {
    setDate(today);
    setTime(futureTime);
  }, []);

  useEffect(() => {
    if (date) {
      dispatch(setSchedulerDate(date));
    }
  }, [date]);

  useEffect(() => {
    if (time) {
      const [hours, minutes] = time.split(':');
      const formattedTime = `${hours}:${minutes.padStart(2, '0')}`;
      dispatch(setSchedulerTime(formattedTime));
    }
  }, [time]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value;
    const minTime = new Date();
    minTime.setMinutes(minTime.getMinutes() + 60);
    const minTimeString = minTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    if (date === today && selectedTime < minTimeString) {
      return;
    }
    setTime(selectedTime);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    console.log(selectedDate, "selectedDate")
    setDate(selectedDate);
  };

  return (
    <div>
      <h1 className="font-poppins text-lg text-gray-900 tracking-wide">Set Time</h1>
      <div className="flex flex-row gap-5">
        <input
          disabled={scheduler.platform === ''}
          type="date"
          value={scheduler.set_date || today}
          min={today}
          onChange={handleDateChange}
          className="w-1/2 h-10 p-2 text-sm tracking-wide rounded-lg"
        />
        <input
          disabled={scheduler.platform === ''}
          type="time"
          // value={scheduler.set_time || futureTime}
          value={scheduler.set_time}
          // min={date === today ? futureTime : '00:00'}
          onChange={handleTimeChange}
          className="w-1/2 h-10 p-2 text-sm tracking-wide rounded-lg"
        />
      </div>
    </div>
  );
};

export default SetTime;
