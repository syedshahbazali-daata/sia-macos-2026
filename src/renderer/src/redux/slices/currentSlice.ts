import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

export type mediaPathType = {
  previewUrl: string
  filePath: string
  isPaid: boolean
}

interface Scheduler {
  id: string
  Instance_id: string
  description_type: string
  city: string
  isScheduled: number
  description_text: string
  signature: string
  set_price: number
  set_date: string
  created_at: number
  set_time: string
  media_path: mediaPathType[]
  platform: string
}

const initialState: Scheduler = {
  id: uuidv4(),
  Instance_id: '',
  description_type: '',
  city: '',
  isScheduled: 0,
  description_text: '',
  signature: '',
  set_price: 0,
  set_date: '',
  created_at: Date.now(),
  set_time: '10:00:00',
  media_path: [],
  platform: ''
}

const currentSchedulerSlice = createSlice({
  name: 'currentScheduler',
  initialState,
  reducers: {
    setSchedulerId: (state, action: PayloadAction<string>) => {
      console.log('action.payload', action.payload)
      state.id = action.payload
    },
    setInstanceId: (state, action: PayloadAction<string>) => {
      state.Instance_id = action.payload
    },
    setDescriptionType: (state, action: PayloadAction<string>) => {
      state.description_type = action.payload
    },
    setCity: (state, action: PayloadAction<string>) => {
      state.city = action.payload
    },
    setIsScheduled: (state, action: PayloadAction<number>) => {
      state.isScheduled = action.payload
    },
    setDescriptionText: (state, action: PayloadAction<string>) => {
      state.description_text = action.payload
    },
    setSignature: (state, action: PayloadAction<string>) => {
      state.signature = action.payload
    },
    setPrice: (state, action: PayloadAction<number>) => {
      state.set_price = action.payload
    },
    setDate: (state, action: PayloadAction<string>) => {
      state.set_date = action.payload
    },
    setTime: (state, action: PayloadAction<string>) => {
      state.set_time = action.payload
    },
    setMediaPath: (state, action: PayloadAction<mediaPathType[]>) => {
      state.media_path = action.payload; // Now accepting mediaPathType[]
    },
    setPlatform: (state, action: PayloadAction<string>) => {
      state.platform = action.payload
    },
    resetScheduler: () => initialState
  }
})

export const {
  setInstanceId,
  setDescriptionType,
  setCity,
  setIsScheduled,
  setDescriptionText,
  setSignature,
  setPrice,
  setDate,
  setTime,
  setMediaPath,
  setPlatform,
  setSchedulerId,
  resetScheduler
} = currentSchedulerSlice.actions

export default currentSchedulerSlice.reducer
