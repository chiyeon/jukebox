import { createStore } from 'vuex';

export default createStore({
   state: {
      queue: []
   },
   mutations: {
      addTrack(state, track) {
         state.queue.push(track);
      },
      setQueue(state, queue) {
         state.queue = queue
      }
   },
   actions: {
      addTrack({ commit }, track) {
         commit("addTrack", track);
      },
      setQueue({ commit }, queue) {
         commit("setQueue", queue)
      }
   },
   getters: {
      getItems: state => state.queue
   }
});