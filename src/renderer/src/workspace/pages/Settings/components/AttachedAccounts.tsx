import { TabsContent } from "@renderer/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@renderer/components/ui/alert-dialog";

import twitter from '@renderer/assets/twitter-icon.png'
import facebook from '@renderer/assets/facebook-icon.png'
import instagram from '@renderer/assets/instagram-icon.png'
import tiktok from '@renderer/assets/tiktok-icon.png'
import twitch from '@renderer/assets/twitch-icon.png'
import OF from '@renderer/assets/of-icon.png'
import youtube from '@renderer/assets/youtube-icon.png'
import { storage, enums } from "@renderer/helpers/storageHelper";
import { useState, useEffect } from "react";

const getInstanceDetails = (instanceId) => {
  const instances = storage.get(enums.INSTANCE, []);
  const selectedInstance = localStorage.getItem("selectedInstanceId");
  return instances.find((instance) => instance.instanceId === selectedInstance);
}

const AttachedAccounts = () => {
  const [attachedAccountsData, setAttachedAccountsData] = useState([]);
  const selectedInstance = localStorage.getItem("selectedInstanceId");
  const [browserLoading, setBrowserLoading] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.send('show-attached-accounts')
    window.electron.ipcRenderer.on('attached-accounts', (event, accounts) => {
      console.log(accounts, "Accounts");
      setAttachedAccountsData(accounts);
    });
  }, []);

  const instanceDetails = getInstanceDetails();

  const platforms = ["all", "twitter", "facebook", "instagram", "tiktok", "OF", "twitch", "youtube"];

  const platformImages = {
    twitter: twitter,
    facebook: facebook,
    instagram: instagram,
    tiktok: tiktok,
    OF: OF,
    twitch: twitch,
    youtube: youtube
  };

  const handleAttachAccount = (platform) => {
    const platformName = platform.toUpperCase();
    let website = "";
    switch (platform) {
      case "twitter":
        website = "https://twitter.com";
        break;
      case "facebook":
        website = "https://business.facebook.com/";
        break;
      case "instagram":
        website = "https://business.facebook.com/";
        break;
      case "twitch":
        website = "https://twitch.tv";
        break;
      case "youtube":
        website = "https://youtube.com";
        break;
      case "tiktok":
        website = "https://tiktok.com";
        break;
      case "OF":
        website = "https://onlyfans.com";
        break;
      default:
        break;
    }

    window.electron.ipcRenderer.send('add-account', website, instanceDetails.userDir);
    setBrowserLoading(true);
  }

  const addToAccount = (platform) => {
    const attachedAccounts = attachedAccountsData.find((account) => account[selectedInstance]);
    if (attachedAccounts) {
      attachedAccounts[selectedInstance].push(platform);
    } else {
      attachedAccountsData.push({[selectedInstance]: [platform]});
    }

    window.electron.ipcRenderer.send('account-added', attachedAccountsData);
    window.electron.ipcRenderer.send('close-add-account-browser');
    setBrowserLoading(false);
    setAttachedAccountsData(attachedAccountsData);
  }

  const handleCloseBrowser = () => {
    window.electron.ipcRenderer.send('close-add-account-browser');
    setBrowserLoading(false);
  }

  const isAccountAttached = (platform) => {
    return attachedAccountsData.find((account) => account[selectedInstance])?.[selectedInstance].includes(platform);
  }

  return (
    <TabsContent value="attached-account">
      <div className="flex flex-col w-full h-[80%] p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-poppins text-3xl font-bold text-gray-900">Attach Accounts</h1>
            <p className="font-poppins text-sm text-gray-600 mt-2">
              Attach your social media accounts to schedule your posts.
            </p>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {platforms.map((platform, index) => (
              index > 0 && (
                <AlertDialog key={platform}>
                  <AlertDialogTrigger
                    onClick={() => handleAttachAccount(platform)}
                    className={`
                      w-full p-4 rounded-xl shadow-sm
                      transition-all duration-300 ease-in-out
                      ${isAccountAttached(platform)
                        ? 'bg-gray-100 cursor-default'
                        : 'bg-white hover:shadow-md cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                          <img
                            src={platformImages[platform]}
                            alt={platform}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <div className="text-left">
                          <p className="font-poppins font-semibold text-gray-900">
                            {platform.toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isAccountAttached(platform) ? 'Connected' : 'Click to connect'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        isAccountAttached(platform) ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="bg-white">
                    {browserLoading && (
                      <>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Connect {platform.toUpperCase()}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Please confirm that you want to add this {platform.toUpperCase()} ACCOUNT to your Profile.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={handleCloseBrowser}
                            className="text-gray-900"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => addToAccount(platform)}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </>
                    )}
                  </AlertDialogContent>
                </AlertDialog>
              )
            ))}
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default AttachedAccounts;
