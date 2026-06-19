// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select.tsx";
import { Textarea } from "@renderer/components/ui/textarea.tsx";
import { Button } from "@renderer/components/ui/button.tsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog.tsx";
import MyProfile from "./components/MyProfile";
import AttachedAccounts from "./components/AttachedAccounts";
import EditSignatures from "./components/EditSignatures";
import CustomDescriptions from "./components/CustomDescriptions";
import AllDescriptions from "./components/AllDescriptions";


const Settings = () => {

  const platforms = ["all", "twitter", "facebook", "instagram", "tiktok", "OF", "youtube"];
  return (
    <div className="flex flex-row w-full h-[90%] p-1">
      <div className="flex flex-col bg-gray-300 gap-5 w-full h-full p-5 mx-5 rounded-2xl">
        <Tabs defaultValue="profile" className="w-[100%] h-full">
          <TabsList className="flex gap-5">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="attached-account">Attached Accounts</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="custom-descriptions">Custom Descriptions</TabsTrigger>
            <TabsTrigger value="all-descriptions">All Descriptions</TabsTrigger>
          </TabsList>
          <MyProfile/>
          <AttachedAccounts/>
          <EditSignatures/>
           <CustomDescriptions/>
          <AllDescriptions/>
        </Tabs>
      </div>
    </div>
  )
}

export default Settings
