import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { Textarea } from "@renderer/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select";
import { Button } from "@renderer/components/ui/button";
import { Card } from "@renderer/components/ui/card";
import { RootState } from '@renderer/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { setPlatform } from '@renderer/redux/slices/currentSlice';
import { SocialMediaPlatform } from '@renderer/types/social-media';
import { addSignature } from '@renderer/redux/slices/SchedulerSlice';
import { useToast } from '@renderer/hooks/use-toast';

// Import platform icons
import twitter from '@renderer/assets/twitter-icon.png';
import facebook from '@renderer/assets/facebook-icon.png';
import instagram from '@renderer/assets/instagram-icon.png';
import tiktok from '@renderer/assets/tiktok-icon.png';
import twitch from '@renderer/assets/twitch-icon.png';
import OF from '@renderer/assets/of-icon.png';
import youtube from '@renderer/assets/youtube-icon.png';

// Platform icons mapping
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

// Type definitions
interface SignaturesData {
  [platform: string]: [string, string];
}

interface Instance {
  [key: string]: SignaturesData;
}

interface CurrentScheduler {
  Instance_id: string;
  platform: string;
}

const EditSignatures = () => {
  const { toast } = useToast();
  const scheduler = useSelector((state: RootState) => state.currentScheduler);
  const [currentPlatform, setCurrentPlatform] = useState(scheduler.platform);
  const [signatures, setSignatures] = useState<SignaturesData>({});
  const [selectType, setSelectType] = useState<string>('');
  const [signature1, setSignature1] = useState('');
  const [signature2, setSignature2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const checkAllPlatformsSignatures = (signatures: SignaturesData) => {
    const platforms = Object.values(SocialMediaPlatform);
    if (platforms.length === 0 || !signatures[platforms[0]]) return ['', ''];

    const [firstSig1, firstSig2] = signatures[platforms[0]];
    const allSameSig1 = platforms.every(platform =>
      signatures[platform]?.[0] === firstSig1
    );
    const allSameSig2 = platforms.every(platform =>
      signatures[platform]?.[1] === firstSig2
    );

    return [
      allSameSig1 ? firstSig1 : '',
      allSameSig2 ? firstSig2 : ''
    ];
  };

  const loadSignatures = async () => {
    try {
      const instanceId = localStorage.getItem('selectedInstanceId');
      const signaturesList = await window.electron.ipcRenderer.invoke('read-json-file', 'SIGNATURES');

      // Find signatures for the selected instance
      const instanceSignatures = signaturesList.find(
        (item: Instance) => Object.keys(item)[0] === instanceId
      );

      if (instanceSignatures) {
        setSignatures(instanceSignatures[instanceId] || {});
      } else {
        setSignatures({});
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
      setSignatures({});
      toast({
        title: "Error",
        description: "Failed to load signatures",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSignatures();
  }, []);

  useEffect(() => {
    dispatch(setPlatform(selectType));
  }, [selectType, dispatch]);

  useEffect(() => {
    if (scheduler.platform === '') {
      setSelectType('');
      setSignature1('');
      setSignature2('');
    }
  }, [scheduler.platform]);

  useEffect(() => {
    setCurrentPlatform(scheduler.platform);
    if (!scheduler.platform) {
      setSignature1('');
      setSignature2('');
      return;
    }

    if (scheduler.platform === 'all') {
      const [commonSig1, commonSig2] = checkAllPlatformsSignatures(signatures);
      setSignature1(commonSig1);
      setSignature2(commonSig2);
    } else if (signatures?.[scheduler.platform]) {
      const [sign1, sign2] = signatures[scheduler.platform];
      setSignature1(sign1 || '');
      setSignature2(sign2 || '');
    } else {
      setSignature1('');
      setSignature2('');
    }
  }, [scheduler.platform, signatures]);

  const handleAddSignature = async () => {
    if (!scheduler.Instance_id || !scheduler.platform) {
      toast({
        title: "Error",
        description: "Please select a platform first",
        className: "bg-red-500 text-white"
      });
      return;
    }

    setIsLoading(true);
    try {
      const instanceId = localStorage.getItem('selectedInstanceId');
      const currentSignatures = await window.electron.ipcRenderer.invoke('read-json-file', 'SIGNATURES') || [];

      let updatedSignatures = [...currentSignatures];
      const instanceIndex = updatedSignatures.findIndex(
        (item: Instance) => Object.keys(item)[0] === instanceId
      );

      const newSignatureData = scheduler.platform === 'all'
        ? Object.values(SocialMediaPlatform).reduce((acc, platform) => ({
            ...acc,
            [platform]: [signature1, signature2]
          }), {})
        : {
            ...signatures,
            [scheduler.platform]: [signature1, signature2]
          };

      if (instanceIndex !== -1) {
        updatedSignatures[instanceIndex] = {
          [instanceId]: newSignatureData
        };
      } else {
        updatedSignatures.push({
          [instanceId]: newSignatureData
        });
      }

      await window.electron.ipcRenderer.invoke('write-json-file', 'SIGNATURES', updatedSignatures);

      toast({
        title: "Success!",
        description: "Signatures updated successfully",
        className: "bg-green-500 text-white border-none"
      });

      await loadSignatures();
    } catch (error) {
      console.error('Error updating signatures:', error);
      toast({
        title: "Error",
        description: "Failed to update signatures",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelectContent = () => (
    <SelectContent>
      <SelectItem value="all">
        <span className="flex items-center gap-2">
          All Platforms
        </span>
      </SelectItem>
      {Object.keys(SocialMediaPlatform).map((platform) => (
        <SelectItem key={platform} value={SocialMediaPlatform[platform]}>
          <span className="flex items-center gap-2">
            <img
              src={platformIcons[SocialMediaPlatform[platform]]}
              alt={platform}
              className="w-4 h-4 object-contain"
            />
            {platform.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  );

  return (
    <TabsContent value="signatures">
      <div className="flex flex-col w-full h-full bg-gray-50 min-h-[90%]">
        {/* Header */}
        <div className="bg-white px-4 py-3">
          <h1 className="font-poppins text-2xl font-bold text-gray-900">Edit Signatures</h1>
          <p className="font-poppins text-sm text-gray-500">
            Add or edit your signatures for different social media platforms
          </p>
        </div>

        <div className="p-4">
          <div className="max-w-full">
            {/* Platform Selection */}
            <Select value={scheduler.platform} onValueChange={(value) => setSelectType(value)}>
              <SelectTrigger className="w-full md:w-[200px] h-10 bg-white mb-3">
                <SelectValue placeholder="SELECT PLATFORM"/>
              </SelectTrigger>
              {renderSelectContent()}
            </Select>

            {/* Signatures Section */}
            <Card className="border-none shadow-sm">
              <div className="px-3 pt-3">
                <Tabs defaultValue="signature-1" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-3">
                    <TabsTrigger value="signature-1">Signature 1</TabsTrigger>
                    <TabsTrigger value="signature-2">Signature 2</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signature-1">
                    <Textarea
                      className="h-[200px] resize-none bg-white"
                      id="signature-areatext-1"
                      value={signature1}
                      onChange={(e) => setSignature1(e.target.value)}
                      disabled={currentPlatform === ""}
                      placeholder="Write your Signature 1"
                    />
                  </TabsContent>

                  <TabsContent value="signature-2">
                    <Textarea
                      className="h-[200px] resize-none bg-white"
                      id="signature-areatext-2"
                      value={signature2}
                      onChange={(e) => setSignature2(e.target.value)}
                      disabled={currentPlatform === ""}
                      placeholder="Write your Signature 2"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Button */}
              <div className="p-3">
                <Button
                  id="add-signature-btn"
                  className="w-full h-10 text-xs tracking-wide"
                  onClick={handleAddSignature}
                  disabled={currentPlatform === "" || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Add Signature"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default EditSignatures;
