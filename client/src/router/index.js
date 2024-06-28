import { createRouter, createWebHistory } from "vue-router"
import HomeView from "../views/HomeView.vue"

const router = createRouter({
   history: createWebHistory(import.meta.env.BASE_URL),
   routes: [
      {
         path: "/",
         name: "home",
         component: HomeView,
      },
      {
         path: "/login",
         name: "Login",
         component: () => import("../views/LoginView.vue"),
         props: { is_register: false },
      },
      {
         path: "/register",
         name: "Register",
         component: () => import("../views/LoginView.vue"),
         props: { is_register: true },
      },
      {
         path: "/upload",
         name: "upload",
         component: () => import("../views/UploadView.vue"),
      },
      {
         path: "/playlists",
         name: "Playlists",
         component: () => import("../views/PlaylistsView.vue")
      },
      {
         path: "/u/:username",
         name: "userprofile",
         component: () => import("../views/UserProfileView.vue"),
      },
      {
         path: "/s/admin",
         name: "admin",
         component: () => import("../views/AdminView.vue"),
         meta: { requiresauth: true },
      },
   ],
})

router.beforeEach(async (to, from, next) => {
   if (to.matched.some((record) => record.meta.requiresauth)) {
      const res = await fetch("/api/userbytoken", {
         include: "credentials",
      })

      if (res.ok) {
         let user = (await res.json()).user
         if (user && user.permissions >= 2) {
            next()
            return
         }
      }

      next({ name: "home" })
   }
   next()
})

export default router
