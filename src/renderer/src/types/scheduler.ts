export interface MediaPath {
  filePath: string
  previewUrl: string
  isPaid: boolean
}

export interface Scheduler {
  id: string
  Instance_id: string
  description_type: string
  city: string
  isScheduled: number
  description_text: string
  signature: string
  set_price: number
  set_date: string
  set_time: string
  media_path: MediaPath[]
  platform: string
  created_at: number
}
