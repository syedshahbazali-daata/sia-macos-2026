// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

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
    addSchedulers: (state, action: PayloadAction<Scheduler[]>) => {
      return action.payload
    },

    addScheduler: (state, action: PayloadAction<Scheduler>) => {
      console.log('I AM HERE')
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
      const { Instance_id, signature, platform } = action.payload;
      console.log(`Updating signature for Instance_id: ${Instance_id}, platform: ${platform}, with signature: ${signature}`);

      // Find the scheduler with the matching Instance_id and platform
      const scheduler = state.find(
        (scheduler) => scheduler.Instance_id === Instance_id && scheduler.platform === platform
      );
      console.log(scheduler)

      if (scheduler) {
        scheduler.signature = signature;  // Update the signature if both Instance_id and platform match
        console.log("Updated scheduler:", scheduler);
      } else {
        console.log("Scheduler not found for Instance_id and platform:", { Instance_id, platform });
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
