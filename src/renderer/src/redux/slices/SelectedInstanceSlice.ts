import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { Instance } from '@renderer/types/Instance'

// This slice is responsible to store the Id for the selected instance and provide a method to get the instance based on that Id
const initialState = {
  instanceId: localStorage.getItem('selectedInstanceId') || '' // Load ID from local storage
}

const selectedInstanceSlice = createSlice({
  name: 'selectedInstance',
  initialState,
  reducers: {
    setInstanceId: (state, action: PayloadAction<string>) => {
      // Adding an instanceId to the state
      state.instanceId = action.payload
      localStorage.setItem('selectedInstanceId', action.payload) // Store in local storage
    }
  }
})

export const { setInstanceId } = selectedInstanceSlice.actions

export const getSelectedInstanceId = (state: RootState): string => state.selectedInstance.instanceId

// A Generic method to get the selectedInstance
const getInstances = (state: RootState): Instance[] => state.instance.instances
export const getSelectedInstance = createSelector(
  [getInstances, getSelectedInstanceId],
  (instances, selectedInstanceId) =>
    instances.find((instance) => instance.instanceId === selectedInstanceId)
)

export default selectedInstanceSlice.reducer
