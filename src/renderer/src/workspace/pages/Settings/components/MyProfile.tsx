import { useState, useEffect } from 'react'
import { TabsContent } from '@renderer/components/ui/tabs'
import { Clock, CreditCard, Shield, User, RefreshCw, Loader2, Bot, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useSelector } from 'react-redux'
import { getSelectedInstance } from '@renderer/redux/slices/SelectedInstanceSlice'
import { usePlan } from '@renderer/hooks/usePlan'
import { getLicensesByNumber, verifyLicense } from '@renderer/lib/license'
import { storage, enums } from '@renderer/helpers/storageHelper'
import { toast } from '@renderer/hooks/use-toast'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@renderer/components/ui/input-otp'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-gray-500' },
  pro: { label: 'Pro', color: 'text-indigo-600' },
  enterprise: { label: 'Enterprise', color: 'text-amber-600' },
}

const MyProfile = (): JSX.Element => {
  const selectedInstance = useSelector(getSelectedInstance)!
  const { plan, license } = usePlan()

  const [showChange, setShowChange] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  const [pathCopied, setPathCopied] = useState(false)
  const [userDataPath, setUserDataPath] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  useEffect(() => {
    window.fileAPI.getUserDataPath().then(setUserDataPath)
    window.aiAPI.getConfig().then((cfg) => {
      if (cfg.openrouter_api_key) setApiKey(cfg.openrouter_api_key)
    })
  }, [])

  const planMeta = PLAN_LABELS[plan] ?? PLAN_LABELS.free

  const expiryDate = license?.expiry_date
    ? typeof (license.expiry_date as { toDate?: () => Date }).toDate === 'function'
      ? (license.expiry_date as { toDate: () => Date }).toDate()
      : new Date((license.expiry_date as { seconds: number }).seconds * 1000)
    : null
  const now = new Date()
  const daysLeft = expiryDate
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const expiryLabel = expiryDate
    ? expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const daysLeftLabel =
    daysLeft !== null
      ? daysLeft > 0
        ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
        : 'Expired'
      : '—'

  const daysLeftColor =
    daysLeft === null ? 'text-gray-500' : daysLeft <= 7 ? 'text-red-600' : 'text-green-600'

  const handleChangeLicense = async (): Promise<void> => {
    if (newCode.trim().length !== 6) {
      toast({ title: 'Invalid Code', description: 'License code must be 6 digits.', variant: 'destructive' })
      return
    }
    if (newCode === license?.license) {
      toast({ title: 'Same License', description: 'This is already your active license code.', variant: 'destructive' })
      return
    }

    setIsChanging(true)
    try {
      const newLicense = await getLicensesByNumber(newCode)
      if (!newLicense) {
        toast({ title: 'Not Found', description: 'No license found for that code.', variant: 'destructive' })
        return
      }
      const isValid = await verifyLicense(newCode)
      if (!isValid) {
        toast({ title: 'License Expired', description: 'That license has already expired.', variant: 'destructive' })
        return
      }

      storage.set(enums.LICENSE, newLicense)
      toast({
        title: 'License Updated',
        description: `Switched to ${newLicense.plan.charAt(0).toUpperCase() + newLicense.plan.slice(1)} plan. Reload to apply.`,
      })
      setNewCode('')
      setShowChange(false)
      // Reload so Redux + usePlan pick up the new license
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      toast({ title: 'Error', description: 'Could not reach the license server.', variant: 'destructive' })
    } finally {
      setIsChanging(false)
    }
  }

  const handleSaveApiKey = async (): Promise<void> => {
    if (!apiKey.trim()) {
      toast({ title: 'Empty Key', description: 'Please enter your OpenRouter API key.', variant: 'destructive' })
      return
    }
    setIsSavingKey(true)
    try {
      await window.aiAPI.saveConfig({ openrouter_api_key: apiKey.trim() })
      setKeySaved(true)
      toast({ title: 'API Key Saved', description: 'OpenRouter key stored. AI bot fixing is now active.' })
      setTimeout(() => setKeySaved(false), 3000)
    } catch {
      toast({ title: 'Error', description: 'Could not save API key.', variant: 'destructive' })
    } finally {
      setIsSavingKey(false)
    }
  }

  return (
    <TabsContent value="profile" className="h-[90%]">
      <div className="flex flex-col h-full space-y-6 p-6 bg-gray-50 overflow-y-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">My Profile</h1>
          <p className="text-sm text-gray-500 font-poppins">
            Manage your personal information and subscription details
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="relative group">
                  <img
                    src={selectedInstance?.instanceAvatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-gray-200 group-hover:border-gray-300 transition-colors duration-300 object-cover"
                  />
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-center justify-center">
                    <User className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 font-poppins">
                      {license?.username ?? selectedInstance?.instanceName ?? '—'}
                    </h2>
                    <p className={`text-sm font-medium font-poppins ${planMeta.color}`}>
                      {planMeta.label} Plan
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="text-sm text-gray-700 font-poppins">
                        License: {license?.license ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className={`w-4 h-4 shrink-0 ${daysLeftColor}`} />
                      <span className={`text-sm font-poppins ${daysLeftColor}`}>
                        {daysLeftLabel}
                      </span>
                    </div>
                    {license?.email && (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-700 font-poppins truncate">
                          {license.email}
                        </span>
                      </div>
                    )}
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
                  <span className={`text-sm font-semibold font-poppins capitalize ${planMeta.color}`}>
                    {planMeta.label}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-poppins">License Code</span>
                  <span className="text-sm font-medium text-gray-900 font-mono tracking-widest">
                    {license?.license ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-poppins">Expiry Date</span>
                  <span className="text-sm font-medium text-gray-900 font-poppins">
                    {expiryLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-poppins">Status</span>
                  <span className={`text-sm font-medium font-poppins ${daysLeft !== null && daysLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {daysLeft !== null && daysLeft > 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile User Directory */}
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-poppins">Profile Directory</h3>
                <p className="text-sm text-gray-500 font-poppins mt-0.5">
                  Browser session data stored for this profile
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fullPath = selectedInstance?.userDir
                    ? `${userDataPath}/${selectedInstance.userDir}`
                    : ''
                  if (fullPath) {
                    navigator.clipboard.writeText(fullPath)
                    setPathCopied(true)
                    setTimeout(() => setPathCopied(false), 2000)
                  }
                }}
                disabled={!selectedInstance?.userDir}
                className="flex items-center gap-2 text-gray-700 border-gray-300 hover:text-gray-900 hover:bg-gray-100 shrink-0 ml-4"
              >
                {pathCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {pathCopied ? 'Copied!' : 'Copy Path'}
              </Button>
            </div>
            <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded-md px-3 py-2 break-all select-all">
              {selectedInstance?.userDir && userDataPath
                ? `${userDataPath}/${selectedInstance.userDir}`
                : '—'}
            </p>
          </CardContent>
        </Card>

        {/* AI Integration — OpenRouter API Key */}
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-poppins">AI Bot Auto-Fix</h3>
                <p className="text-sm text-gray-500 font-poppins">
                  When a bot breaks, AI automatically detects and fixes it using OpenRouter
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-or-v1-…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10 font-mono text-sm bg-white border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                onClick={handleSaveApiKey}
                disabled={isSavingKey}
                className={keySaved ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isSavingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : keySaved ? (
                  'Saved ✓'
                ) : (
                  'Save Key'
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-400 font-poppins mt-2">
              Get your key at{' '}
              <span className="text-indigo-500 font-medium">openrouter.ai/keys</span>.
              The key is stored locally and never leaves your device.
            </p>
          </CardContent>
        </Card>

        {/* Change License Section */}
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-poppins">Change License</h3>
                <p className="text-sm text-gray-500 font-poppins mt-0.5">
                  Enter a new 6-digit license code to switch your plan
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowChange((v) => !v); setNewCode('') }}
                className="flex items-center gap-2 text-gray-700 border-gray-300 hover:text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4" />
                {showChange ? 'Cancel' : 'Change License'}
              </Button>
            </div>

            {showChange && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <InputOTP value={newCode} onChange={setNewCode} maxLength={6}>
                  <InputOTPGroup>
                    {[0, 1, 2].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-12 bg-white text-gray-900 font-bold border border-gray-300 rounded-md shadow-sm" />
                    ))}
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-gray-400" />
                  <InputOTPGroup>
                    {[3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-12 bg-white text-gray-900 font-bold border border-gray-300 rounded-md shadow-sm" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  onClick={handleChangeLicense}
                  disabled={isChanging || newCode.length !== 6}
                  className="w-48"
                >
                  {isChanging ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
                  ) : (
                    'Apply New License'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  )
}

export default MyProfile
