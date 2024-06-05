import { createStore } from 'vuex';

export default createStore({
   state: {
      queue: [], // songs user wants to play
      afterQueue: [], // songs subsequent after (not explicitly selected)
      tracks: [], // all tracks user is currently pointed at
      user: null,
   },
   mutations: {
      addTrack(state, track) {
         state.queue = [...state.queue, track]
      },
      setQueue(state, queue) {
         state.queue = queue
      },
      setUser(state, user) {
         state.user = user
      },
      setAfterQueue(state, queue) {
         state.afterQueue = queue
      },
      setTracks(state, tracks) {
         state.tracks = tracks
      }
   },
   actions: {
      addTrack({ commit }, track) {
         commit("addTrack", track)
      },
      setQueue({ commit }, queue) {
         commit("setQueue", queue)
      },
      setUser({ commit }, user) {
         commit("setUser", user)
      },
      setAfterQueue({ commit }, queue) {
         commit("setAfterQueue", queue)
      },
      setTracks({ commit }, tracks) {
         commit("setTracks", tracks)
      }
   },
   getters: {
      getQueue: state => state.queue,
      getUser: state => state.user,
      getAfterQueue: state => state.afterQueue,
      getTracks: state => state.tracks
   }
});
