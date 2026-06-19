import { TabsContent } from "@renderer/components/ui/tabs";
import { Clock, CreditCard, User } from 'lucide-react';
import { Card, CardContent } from '@renderer/components/ui/card';

import { getSelectedInstance } from "@renderer/redux/slices/SelectedInstanceSlice";
import { useSelector } from "react-redux";


const MyProfile = () => {
  // Mocking the useSelector data for demonstration
  const selectedInstance = useSelector(getSelectedInstance)!


  return (
    <TabsContent value="profile" className={"h-[90%]"}>
      <div className="flex flex-col h-full space-y-6 p-6 bg-gray-50">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">My Profile</h1>
          <p className="text-sm text-gray-500 font-poppins">
            Manage your personal information and subscription details
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="relative group">
                  <img
                    src={selectedInstance.instanceAvatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-gray-200 group-hover:border-gray-300 transition-colors duration-300"
                  />
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-center justify-center">
                    <User className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 font-poppins">
                      Michael Scott
                    </h2>
                    <p className="text-sm text-gray-500 font-poppins">Premium Member</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-poppins">
                        License Code: 123321
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 font-poppins">
                        Expires in: 7 Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                Subscription Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-poppins">Plan</span>
                  <span className="text-sm font-medium text-gray-900 font-poppins">Premium</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-poppins">Billing Cycle</span>
                  <span className="text-sm font-medium text-gray-900 font-poppins">Monthly</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-poppins">Next Payment</span>
                  <span className="text-sm font-medium text-gray-900 font-poppins">June 21, 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
};

export default MyProfile;
