import { useState } from 'react';
import { TabsContent } from "@renderer/components/ui/tabs";
import { Card } from "@renderer/components/ui/card";
import { Button } from "@renderer/components/ui/button";
import { Textarea } from "@renderer/components/ui/textarea";
import { useToast } from "@renderer/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { Loader2 } from 'lucide-react';

const CustomDescriptions = () => {
  const { toast } = useToast();
  const [descriptions, setDescriptions] = useState('');
  const [splitBy, setSplitBy] = useState('\n'); // Default split by new line
  const [isLoading, setIsLoading] = useState(false);
  const instanceId = localStorage.getItem('selectedInstanceId') ?? ''

  const handleSplitChange = (value: string) => {
    const splitMap: Record<string, string> = {
      'newline': '\n',
      'comma': ',',
      'semicolon': ';',
      'period': '.'
    };
    setSplitBy(splitMap[value] ?? '\n')
  };

  const handleAddDescriptions = async () => {
    if (!descriptions.trim()) {
      toast({
        title: "Error",
        description: "Please enter some descriptions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Split descriptions by selected delimiter and filter empty ones
      const newDescriptions = descriptions
        .split(splitBy)
        .map(desc => desc.trim())
        .filter(desc => desc.length > 0);

      // Read existing data
      const existingData = await window.electron.ipcRenderer.invoke('read-json-file', 'CUSTOM_DESCRIPTIONS') || [];

      // Find if instance already has descriptions
      const instanceIndex = existingData.findIndex(
        (item: any) => Object.keys(item)[0] === instanceId
      );

      if (instanceIndex !== -1) {
        // Merge existing and new descriptions, remove duplicates
        const existingDescriptions = existingData[instanceIndex][instanceId];
        const mergedDescriptions = [...new Set([...existingDescriptions, ...newDescriptions])];
        existingData[instanceIndex] = { [instanceId]: mergedDescriptions };
      } else {
        // Add new instance with descriptions
        existingData.push({ [instanceId]: newDescriptions });
      }

      // Save updated data
      await window.electron.ipcRenderer.invoke('write-json-file', 'CUSTOM_DESCRIPTIONS', existingData);

      // Show success toast with green color
      toast({
        title: "Success",
        description: "Descriptions added successfully",
        variant: "default",
        className: "bg-green-500 text-white border-none"
      });

      // Clear the input after successful addition
      setDescriptions('');
    } catch (error) {
      console.error('Error saving descriptions:', error);
      toast({
        title: "Error",
        description: "Failed to save descriptions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TabsContent value="custom-descriptions" className="h-[90%]">
      <div className="flex flex-col w-full h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-3">
          <h1 className="font-poppins text-2xl font-bold text-gray-900">Custom Descriptions</h1>
          <p className="font-poppins text-sm text-gray-500">
            Add and manage your custom descriptions
          </p>
        </div>

        <div className="p-4">
          <div className="w-full">
            <Card className="border-none shadow-sm p-4">
              {/* Split Options */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Split Descriptions By
                </label>
                <Select
                  onValueChange={handleSplitChange}
                  defaultValue="newline"
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select split option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newline">New Line</SelectItem>
                    <SelectItem value="comma">Comma</SelectItem>
                    <SelectItem value="semicolon">Semicolon</SelectItem>
                    <SelectItem value="period">Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Descriptions Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Descriptions
                </label>
                <Textarea
                  className="min-h-[150px] bg-white"
                  placeholder="Enter your descriptions here..."
                  value={descriptions}
                  onChange={(e) => setDescriptions(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Descriptions will be split based on your selected delimiter. Duplicates will be automatically removed.
                </p>
              </div>

              {/* Add Button */}
              <Button
                className="w-full"
                onClick={handleAddDescriptions}
                disabled={isLoading || !descriptions.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Descriptions...
                  </>
                ) : (
                  'Add Descriptions'
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default CustomDescriptions;
