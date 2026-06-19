import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { storage, enums } from '../../helpers/storageHelper'
import { Instance } from '@renderer/types/Instance'
import { avatars } from '@renderer/lib/avatars'

const initialState = {
  instances: storage.get(enums.INSTANCE, [] as Instance[]), // Load instances from storage or an empty array
  availableAvatars: [...avatars]
}

const instanceSlice = createSlice({
  name: 'instance',
  initialState,
  reducers: {
    addInstance: (state, action: PayloadAction<Instance>) => {
      const { instanceAvatar } = action.payload
      // Remove the avatar from availableAvatars
      state.availableAvatars = state.availableAvatars.filter((avatar) => avatar !== instanceAvatar)
      // Adding a new instance to the state
      state.instances.push(action.payload)
      // Persist the updated instances array in storage
      storage.set(enums.INSTANCE, state.instances)
    },
    deleteInstance: (state, action: PayloadAction<string>) => {
      // Find the instance to delete
      const instanceToDelete = state.instances.find(
        (instance: Instance) => instance.instanceId === action.payload
      )

      if (instanceToDelete) {
        const { instanceAvatar } = instanceToDelete
        // Add the avatar back to availableAvatars
        state.availableAvatars.push(instanceAvatar)
      }

      // Deleting the instance by its ID
      state.instances = state.instances.filter(
        (instance: Instance) => instance.instanceId !== action.payload
      )
      // Persist the updated instances array in storage
      storage.set(enums.INSTANCE, state.instances)
    }
  }
})



export const { addInstance, deleteInstance } = instanceSlice.actions
export default instanceSlice.reducer
