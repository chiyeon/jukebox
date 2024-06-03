import { createStore } from 'vuex';

export default createStore({
   state: {
      queue: [],
      user: null 
   },
   mutations: {
      addTrack(state, track) {
         state.queue.push(track)
      },
      setQueue(state, queue) {
         state.queue = queue
      },
      setUser(state, user) {
         state.user = user
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
      }
   },
   getters: {
      getQueue: state => state.queue,
      getUser: state => state.user
   }
});
