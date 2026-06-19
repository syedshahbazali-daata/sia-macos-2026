// Interval.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select';
import { ClockArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllSchedulers } from '../../../../ScheduledPlans/ScheduledPlans';
import { setDate, setTime } from '@renderer/redux/slices/currentSlice';
import { RootState } from '@renderer/redux/store';

const Interval = (): JSX.Element => {
  const currentScheduler = useSelector((state: RootState) => state.currentScheduler);
  const schedulers = useSelector(selectAllSchedulers);
  const selectedInstance = localStorage.getItem("selectedInstanceId");
  const platformSchedulers = schedulers?.filter(
    (scheduler) => scheduler.platform === currentScheduler.platform
  );
  const [selectTime, setSelectTime] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectTime && platformSchedulers.length > 0) {
      const lastPlatformScheduler = platformSchedulers[platformSchedulers.length - 1];

      const [lastSchedulerDate, lastSchedulerTime] = `${lastPlatformScheduler?.set_date} ${lastPlatformScheduler?.set_time}`.split(' ');

      // Create date object in local timezone
      const dateObj = new Date(`${lastSchedulerDate}T${lastSchedulerTime}`);

      // Add hours directly to the date object
      dateObj.setHours(dateObj.getHours() + Number(selectTime));

      // Format the new date and time
      const newSchedulerDate = dateObj.toLocaleDateString('en-CA');
      const newSchedulerTime = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      dispatch(setDate(newSchedulerDate));
      dispatch(setTime(newSchedulerTime));
    }
  }, [selectTime, schedulers, currentScheduler.platform]);

  useEffect(() => {
    if (!currentScheduler.platform) setSelectTime('');
  }, [currentScheduler.platform]);

  return (
    <Select
      onValueChange={(value) => setSelectTime(value)}
      disabled={platformSchedulers.length === 0}
    >
      <SelectTrigger className="h-10 bg-white">
        <SelectValue placeholder="Select Interval" />
      </SelectTrigger>
      <SelectContent>
        {[...Array(24).keys()].map((i) => (
          <SelectItem value={String(i + 1)} key={i}>
            <div className="flex gap-2 items-center">
              <ClockArrowUp className="w-[18px] h-[18px] text-orange-600" />
              <div className="text-[16px] ">{i + 1} hours</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Interval;
