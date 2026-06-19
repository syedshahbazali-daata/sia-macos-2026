import { useEffect, useState } from 'react';
import { Eye, Calendar, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from "@renderer/components/ui/card";
import { Input } from "@renderer/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@renderer/components/ui/dialog";
import { SocialMediaPlatform } from '@renderer/types/social-media';



// Import platform icons
import twitter from '@renderer/assets/twitter-icon.png';
import facebook from '@renderer/assets/facebook-icon.png';
import instagram from '@renderer/assets/instagram-icon.png';
import tiktok from '@renderer/assets/tiktok-icon.png';
import OF from '@renderer/assets/of-icon.png';
import youtube from '@renderer/assets/youtube-icon.png';

const platformIcons = {
  'Twitter Post': twitter,
  'Facebook': facebook,
  'Instagram post': instagram,
  'Instagram story': instagram,
  'Tik Tok Post': tiktok,
  'OF Mass Messaging': OF,
  'OF Post': OF,
  'YouTube Shorts': youtube
};

interface MediaItem {
  filePath: string;
  previewUrl?: string;
  isPaid: boolean;
}

interface SchedulerDetails {
  id: string;
  description_text: string;
  set_date: string;
  set_time: string;
  media_path: MediaItem[];
  platform: string;
  isScheduled: number;
}

interface ViewScheduleModalProps {
  scheduler: SchedulerDetails;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const ViewScheduleModal = ({ scheduler, showModal, setShowModal }: ViewScheduleModalProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaError, setMediaError] = useState<{ [key: string]: boolean }>({});

  const handleNext = () => {
    setCurrentMediaIndex((prev) =>
      prev === scheduler.media_path.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prev) =>
      prev === 0 ? scheduler.media_path.length - 1 : prev - 1
    );
  };

  const handleMediaError = (path: string) => {
    setMediaError(prev => ({
      ...prev,
      [path]: true
    }));
  };

  const getFileType = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    if (['mp4', 'mov', 'avi', 'wmv'].includes(extension || '')) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    return 'unknown';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={platformIcons[scheduler.platform]}
              alt={scheduler.platform}
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm font-medium">Post Details</span>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >

          </button>
        </DialogHeader>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto">
          {/* Media Section */}
          {scheduler.media_path.length > 0 && (
            <div className="relative bg-black">
              <div className="aspect-video relative">
                {getFileType(scheduler.media_path[currentMediaIndex].filePath) === 'video' ? (
                  <video
                    key={scheduler.media_path[currentMediaIndex].filePath}
                    className="w-full h-full object-contain"
                    controls
                    onError={() => handleMediaError(scheduler.media_path[currentMediaIndex].filePath)}
                  >
                    {/*<source src={scheduler.media_path[currentMediaIndex].filePath} />*/}
                    <source src={`file://${scheduler.media_path[currentMediaIndex].filePath}`} />
                  </video>
                ) : (
                  <img
                    // src={scheduler.media_path[currentMediaIndex].filePath}
                    src={`file://${scheduler.media_path[currentMediaIndex].filePath}`}
                    alt="Media content"
                    className="w-full h-full object-contain"
                    onError={() => handleMediaError(scheduler.media_path[currentMediaIndex].filePath)}
                  />
                )}

                {mediaError[scheduler.media_path[currentMediaIndex].filePath] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <p className="text-sm text-gray-500">Media not found</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                {scheduler.media_path.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-white" />
                    </button>

                    {/* Media Counter */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                      {currentMediaIndex + 1} / {scheduler.media_path.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {scheduler.media_path.length > 1 && (
                <div className="flex gap-1 p-1 bg-black/90">
                  {scheduler.media_path.map((media, index) => (
                    <button
                      key={media.filePath}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`relative flex-shrink-0 w-14 h-14 overflow-hidden ${
                        index === currentMediaIndex
                          ? 'ring-2 ring-white'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {getFileType(media.filePath) === 'video' ? (
                        <video
                          // src={media.filePath}
                          src={`file://${media.filePath}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          // src={media.filePath}
                          src={`file://${media.filePath}`}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Section */}
          <div className="p-4 space-y-4">
            {/* Schedule Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(scheduler.set_date)}
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                {scheduler.set_time}
              </div>
              <span
                className={`ml-auto inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  scheduler.isScheduled === 1
                    ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                    : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10'
                }`}
              >
                {scheduler.isScheduled === 1 ? 'Scheduled' : 'To Be Scheduled'}
              </span>
            </div>

            {/* Description */}
            <div className="pb-2">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {scheduler.description_text}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};



// Main History Component
const History = (): JSX.Element => {
  const [data, setData] = useState<SchedulerDetails[]>([]);
  const [filteredData, setFilteredData] = useState<SchedulerDetails[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const currentInstanceId = localStorage.getItem('selectedInstanceId');
  const [open, setOpen] = useState(false);
  const [scheduler, setScheduler] = useState<SchedulerDetails | null>(null);

  useEffect(() => {
    const loadSchedules = async (): Promise<void> => {
      try {
        const schedulesData = await window.electron.ipcRenderer.invoke('read-schedules');
        // Sort data by date in descending order
        let sortedData = schedulesData.sort((a, b) =>
          new Date(b.set_date).getTime() - new Date(a.set_date).getTime()
        );

        // check instance_id === currentInstanceId
        sortedData = sortedData.filter((item) => item.Instance_id === currentInstanceId);
        setData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        console.error('Error loading schedules:', error);
        setData([]);
        setFilteredData([]);
      }
    };

    loadSchedules();
  }, [currentInstanceId]);

  useEffect(() => {
    let filtered = [...data];

    if (selectedPlatform !== 'All') {
      filtered = filtered.filter((item) => item.platform === selectedPlatform);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.description_text?.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query)
      );
    }

    setFilteredData(filtered);
  }, [selectedPlatform, searchQuery, data]);

  const PlatformIcon = ({ platform }) => (
    <div className="flex items-center gap-2">
      <img
        src={platformIcons[platform]}
        alt={platform}
        className="w-5 h-5 object-contain"
      />
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full bg-gray-50">
      {scheduler && (
        <ViewScheduleModal
          scheduler={scheduler}
          showModal={open}
          setShowModal={setOpen}
        />
      )}

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b">
        <h1 className="font-poppins text-2xl font-bold text-gray-900">History</h1>
        <p className="font-poppins text-sm text-gray-500 mt-1">
          View and manage your scheduled posts history
        </p>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="w-full h-full flex flex-col gap-4">
          {/* Filters */}
          <Card className="p-4 border-none shadow-sm">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by description or platform..."
                  className="pl-10 bg-white h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[240px] bg-white h-10">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Platforms</SelectItem>
                  {Object.keys(SocialMediaPlatform).map((platform) => (
                    <SelectItem key={platform} value={SocialMediaPlatform[platform]}>
                      <span className="flex items-center gap-2">
                        <img
                          src={platformIcons[SocialMediaPlatform[platform]]}
                          alt={platform}
                          className="w-4 h-4 object-contain"
                        />
                        {platform}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table Card */}
          <Card className="flex-1 border-none shadow-sm overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full min-w-full table-fixed text-sm text-gray-600">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-100">
                    <th className="w-12 px-3 py-4 text-left font-medium text-gray-500">#</th>
                    <th className="w-12 px-3 py-4 text-left font-medium text-gray-500"></th>
                    <th className="w-[25%] px-3 py-4 text-left font-medium text-gray-500">Description</th>
                    <th className="w-[15%] px-3 py-4 text-left font-medium text-gray-500">Schedule</th>
                    <th className="w-[12%] px-3 py-4 text-left font-medium text-gray-500">Time</th>
                    <th className="w-[15%] px-3 py-4 text-left font-medium text-gray-500">Status</th>
                    <th className="w-16 px-3 py-4 text-center font-medium text-gray-500">Media</th>
                    <th className="w-16 px-3 py-4 text-center font-medium text-gray-500">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-default"
                      >
                        <td className="px-3 py-4 font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-4">
                          <PlatformIcon platform={item.platform} />
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-gray-600 truncate" title={item.description_text}>
                            {item.description_text}
                          </p>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{item.set_date}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{item.set_time}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.isScheduled === 1
                                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                                : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10'
                            }`}
                          >
                            {item.isScheduled === 1 ? 'Scheduled' : 'To Be Scheduled'}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-center">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-600/10">
                              {item.media_path.length}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                setOpen(true);
                                setScheduler(item);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8">
                        <div className="text-center">
                          <p className="text-gray-500 text-sm">No records found</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {searchQuery || selectedPlatform !== 'All'
                              ? 'Try adjusting your filters'
                              : 'Schedule some posts to see them here'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default History;
