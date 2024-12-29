<template>
   <div class="login-box">
      <div class="tabs">
         <button
            class="tab login-tab-title selected"
            @click="set_registering(false)"
            :ref="form_tab_refs[1]"
         >
            LOGIN
         </button>
         <button
            class="tab login-tab-title"
            @click="set_registering(true)"
            :ref="form_tab_refs[0]"
         >
            REGISTER
         </button>
      </div>
      <div class="form">
         <form>
            <label for="username"
               >Username
               <p class="required" v-if="is_register">
                  *
               </p></label
            >
            <input
               ref="username_ref"
               id="login-username"
               type="text"
               placeholder="capybara"
               name="username"
               maxlength="20"
               required
            />

            <label for="password"
               >Password
               <p class="required" v-if="is_register">
                  *
               </p></label
            >
            <input
               ref="password_ref"
               id="login-password"
               type="password"
               placeholder="password"
               name="password"
               maxlength="50"
               required
            />

            <div v-if="is_register">
               <label for="email"
                  >Email
                  <p class="required">*</p></label
               >
               <input
                  ref="email_ref"
                  type="text"
                  placeholder="capybara@fnaf.com"
                  name="email"
                  maxlength="40"
                  required
               />

               <label for="bio">Bio</label>
               <textarea
                  ref="bio_ref"
                  maxlength="300"
                  placeholder="Just a capybara."
               />

               <label for="icon">Icon</label>
               <input
                  ref="icon_ref"
                  type="file"
                  accepts=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp"
               />
            </div>

            <button
               ref="submit_button_ref"
               type="submit"
               @click="handle_submit"
            >
               {{ is_register ? "Register" : "Login" }}
            </button>
         </form>
      </div>
   </div>
   <LoadingScreen message="Loading" v-if="loading" />
</template>

<script setup>
import { ref, defineProps, watch, onMounted } from "vue"
import { useStore } from "vuex"
import router from "../router"
import { useRoute } from "vue-router"
import { compress_image } from "../utils/image.js"
import LoadingScreen from "../components/LoadingComponent.vue"
import eventbus from "../eventbus"

const props = defineProps({
   is_register: false
})
const is_register = ref(props.is_register)
const store = useStore()
const route = useRoute()

const submit_button_ref = ref(null)
const form_tab_refs = [ref(null), ref(null)]
const username_ref = ref(null)
const password_ref = ref(null)
const bio_ref = ref(null)
const icon_ref = ref(null)
const email_ref = ref(null)

const loading = ref(false)

const handle_submit = async (e) => {
   e.preventDefault()

   if (username_ref.value.value == "" || password_ref.value.value == "") {
      return eventbus.emit("show_notification", "Must include username & password")
   }

   loading.value = true

   let formdata = new FormData()
   formdata.append("username", username_ref.value.value)
   formdata.append("password", password_ref.value.value)

   if (is_register.value) {
      if (email_ref.value.value == "") eventbus.emit("show_notification", "Email required")
      formdata.append("email", email_ref.value.value)
      if (bio_ref.value.value != "") formdata.append("bio", bio_ref.value.value)
      if (icon_ref.value.files.length != 0) {
         const compressed_icon = await compress_image(
            icon_ref.value.files[0],
            512,
            0.29
         )
         formdata.append("icon", compressed_icon)
         console.log(
            `Compressed album from ${icon_ref.value.files[0].size / 1024}kb to ${compressed_icon.size / 1024}kb.`
         )
      }
   }

   let res = await fetch("/api/" + (is_register.value ? "signup" : "login"), {
      method: "POST",
      body: formdata,
   })

   let json = await res.json()

   loading.value = false
   if (res.status == 200) {
      eventbus.emit("show_notification", `${is_register.value ? "Registered" : "Logged in"} successfully`)
      store.dispatch("setUser", json.user)
      router.push({ path: "/" })
   } else {
      eventbus.emit("show_notification",
         `Unable to ${is_register.value ? "register" : "login"}: ${json.message}`
      )
   }
}

const toggle_registering = () => {
   is_register.value = !is_register.value
   if (is_register.value) {
      router.push({ name: "Login" })
   } else {
      router.push({ name: "Register" })
   }
}

const set_registering = (enabled) => {
   is_register.value = enabled
   if (is_register.value) {
      router.push({ name: "Register" })
   } else {
      router.push({ name: "Login" })
   }
}

onMounted(() => {
   document.querySelector(".tab.selected").classList.remove("selected")
   form_tab_refs[props.is_register ? 0 : 1].value.classList.add("selected")
})

watch(() => route.name, (newval) => {
   is_register.value = newval === "Register"

   document.querySelector(".tab.selected").classList.remove("selected")
   form_tab_refs[newval === "Register" ? 0 : 1].value.classList.add("selected")
})
</script>

<style scoped>
.login-box {
   display: flex;
   flex-direction: column;

   max-width: 300px;

   margin: auto;
   margin-top: 100px;

   padding-bottom: 300px;
}

.tabs {
   flex: 0.2;
   width: 100%;

   display: flex;
   justify-content: center;
   align-items: center;
}

.tab {
   flex: 1;
   background-color: var(--background-2);
   height: 50px;
   border: none;
   cursor: pointer;
   border-radius: 4px 4px 0 0;
}

.tab p {
   text-align: center;
}

.tab.selected {
   background-color: var(--background-3);
}

.form {
   flex: 1;
   background-color: var(--background-3);
}

.required {
   display: inline;
   color: var(--accent-cancel);
}

form {
   display: flex;
   flex-direction: column;
   padding: 20px;
}

input[type="text"],
input[type="password"],
textarea {
   padding: 6px 4px;
   margin-bottom: 8px;
   width: 100%;
   box-sizing: border-box;
   background-color: var(--background-2);
}

input,
label,
textarea {
   font-size: 14px;
}

form button {
   padding: 12px 0;
   margin-top: 8px;
}
</style>
