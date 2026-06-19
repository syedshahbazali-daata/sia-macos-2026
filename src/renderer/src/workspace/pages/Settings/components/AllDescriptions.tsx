import { useState, useEffect } from 'react';
import { TabsContent } from "@renderer/components/ui/tabs";
import { Card } from "@renderer/components/ui/card";
import { Input } from "@renderer/components/ui/input";
import { Button } from "@renderer/components/ui/button";
import { useToast } from "@renderer/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog";
import { Search, Copy, Check, RefreshCw } from 'lucide-react';

const AllDescriptions = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDescriptions = async () => {
    try {
      const instanceId = localStorage.getItem('selectedInstanceId');
      const DESCRIPTIONLIST = await window.electron.ipcRenderer.invoke('read-json-file', 'CUSTOM_DESCRIPTIONS');

      // Get descriptions for the selected instance
      const instanceDescriptions = DESCRIPTIONLIST.find(
        (item: any) => Object.keys(item)[0] === instanceId
      );

      if (instanceDescriptions) {
        setDescriptions(instanceDescriptions[instanceId] || []);
      } else {
        setDescriptions([]);
      }
    } catch (error) {
      console.error('Error loading descriptions:', error);
      setDescriptions([]);
      toast({
        title: "Error",
        description: "Failed to load descriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDescriptions();
  }, []); // Load when component mounts

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDescriptions();
    toast({
      title: "Refreshed",
      description: "Descriptions updated successfully",
      className: "bg-green-500 text-white border-none"
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredDescriptions = descriptions.filter(desc =>
    desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyToClipboard = (content: string, index?: number) => {
    navigator.clipboard.writeText(content);

    toast({
      title: "Copied!",
      description: "Description copied to clipboard",
      duration: 2000,
    });

    if (typeof index === 'number') {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <TabsContent value="all-descriptions" className="h-full">
      <div className="flex flex-col w-full bg-gray-50 h-[93%]">
        {/* Header */}
        <div className="bg-white px-4 py-3">
          <h1 className="font-poppins text-2xl font-bold text-gray-900">All Descriptions</h1>
          <p className="font-poppins text-sm text-gray-500">
            Browse and use your saved descriptions
          </p>
        </div>

        <div className="p-4">
          <div className="w-full">
            {/* Search Bar and Refresh Button */}
            <Card className="mb-3 p-3 border-none shadow-sm">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search in descriptions..."
                    className="pl-8 h-9"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-3 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </Card>

            {/* Descriptions List */}
            <Card className="border-none shadow-sm">
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Loading descriptions...
                  </div>
                ) : filteredDescriptions.length > 0 ? (
                  filteredDescriptions.map((desc, index) => (
                    <div
                      key={index}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setSelectedDescription(desc);
                        setIsDialogOpen(true);
                      }}
                    >
                      <p className="text-sm text-gray-600">
                        {truncateText(desc)}
                      </p>
                      <div className="flex items-center justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyToClipboard(desc, index);
                          }}
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchQuery ? 'No descriptions found' : 'No descriptions available'}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Description Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Description Details</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                {selectedDescription}
              </div>
              <Button
                className="w-full mt-4 text-xs gap-2"
                onClick={() => handleCopyToClipboard(selectedDescription)}
              >
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TabsContent>
  );
};

export default AllDescriptions;
