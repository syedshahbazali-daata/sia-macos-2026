import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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

// Initialize with an empty array or default values as needed
const initialState: Scheduler[] = []

const SchedulerSlice = createSlice({
  name: 'scheduler',
  initialState,
  reducers: {
    addSchedulers: (_state, action: PayloadAction<Scheduler[]>) => {
      return action.payload
    },

    addScheduler: (state, action: PayloadAction<Scheduler>) => {
      state.push(action.payload)
    },
    updateScheduler: (state, action: PayloadAction<Scheduler>) => {
      const index = state.findIndex(
        (scheduler) => scheduler.Instance_id === action.payload.Instance_id
      )
      if (index !== -1) {
        state[index] = action.payload
      }
    },



    deleteScheduler: (state, action: PayloadAction<string>) => {
      return state.filter((scheduler) => scheduler.id !== action.payload)
    },
    clearSchedulersByPlatform: (state, action: PayloadAction<string>) => {
      return state.filter((scheduler) => scheduler.platform !== action.payload)
    },
    addSignature(
      state,
      action: PayloadAction<{ Instance_id: string; signature: string; platform: string }>
    ) {
      const { Instance_id, signature, platform } = action.payload
      const scheduler = state.find(
        (s) => s.Instance_id === Instance_id && s.platform === platform
      )
      if (scheduler) {
        scheduler.signature = signature
      }
    }
  }
})

export const {
  addScheduler,
  updateScheduler,
  deleteScheduler,
  clearSchedulersByPlatform,
  addSchedulers,
  addSignature
} = SchedulerSlice.actions
export default SchedulerSlice.reducer
