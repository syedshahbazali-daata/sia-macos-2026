import { configureStore } from '@reduxjs/toolkit'
import instanceReducer from './slices/instanceSlice'
import selectedInstanceReducer from './slices/SelectedInstanceSlice'
import schedulerReducer from './slices/SchedulerSlice'
import currentSchedulerReducer from './slices/currentSlice'
// Set up the store
//#ts-ignore the store component requires a reducer
const store = configureStore({
  reducer: {
    instance: instanceReducer,
    selectedInstance: selectedInstanceReducer,
    currentScheduler: currentSchedulerReducer,
    scheduler: schedulerReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export default store
