<template>
  <div class="login-box">
    <div class="tabs">
      <button 
          class="tab login-tab-title selected"
          @click="switch_to(FORM_LOGIN)"
          :ref="form_tab_refs[FORM_LOGIN]"
      >
          LOGIN
      </button>
      <button 
        class="tab login-tab-title"
        @click="switch_to(FORM_REGISTER)"
        :ref="form_tab_refs[FORM_REGISTER]"
      >
          REGISTER
      </button>
      </div>
      <div class="form">
        <form>
            <label for="username">Username<p class="required" v-if="form_type == FORM_REGISTER">*</p></label>
            <input ref="username_ref" id="login-username" type="text" placeholder="capybara" name="username" maxlength="20" required>

            <label for="password">Password<p class="required" v-if="form_type == FORM_REGISTER">*</p></label>
            <input ref="password_ref" id="login-password" type="password" placeholder="passw0rd" name="password" maxlength="50" required>

            <div v-if="form_type == FORM_REGISTER">
               <label for="email">Email<p class="required">*</p></label>
               <input ref="email_ref" type="text" placeholder="capybara@fnaf.com" name="email" maxlength="40" required>

               <label for="bio">Bio</label>
               <textarea ref="bio_ref" maxlength="300" placeholder="Just a capybara." />

               <label for="icon">Icon</label>
               <input ref="icon_ref" type="file" accepts=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp" />
            </div>
          
            <button ref="submit_button_ref" type="submit" @click="handle_submit">{{ form_type ? "Register" : "Login" }}</button>
        </form>
      </div>
  </div>
   <LoadingScreen message="Loading" v-if="loading" />
</template>

<script setup>
import { ref } from "vue"
import { useStore } from "vuex"
import router from "../router"
import { compress_image } from "../utils/image.js"
import LoadingScreen from "../components/LoadingComponent.vue"

const store = useStore()
const FORM_LOGIN = 0
const FORM_REGISTER = 1

const submit_button_ref = ref(null)
const form_tab_refs = [ref(null), ref(null)]
const username_ref = ref(null)
const password_ref = ref(null)
const bio_ref = ref(null)
const icon_ref = ref(null)
const email_ref = ref(null)

const form_type = ref(FORM_LOGIN)
const loading = ref(false)

const handle_submit = async (e) => {
    e.preventDefault()

    if (username_ref.value.value == "" || password_ref.value.value == "") {
        return alert("Must include username and password")
    }

   loading.value = true

   let formdata = new FormData()
   formdata.append("username", username_ref.value.value)
   formdata.append("password", password_ref.value.value)

   if (form_type.value == FORM_REGISTER) {
      if (email_ref.value.value == "") return alert("Must include email!")
      formdata.append("email", email_ref.value.value)
      if (bio_ref.value.value != "") formdata.append("bio", bio_ref.value.value)
      if (icon_ref.value.files.length != 0) { 
         const compressed_icon = await compress_image(icon_ref.value.files[0], 256, 0.7)
         formdata.append("icon", compressed_icon)
         console.log(`Compressed album from ${icon_ref.value.files[0].size / 1024}kb to ${compressed_icon.size / 1024}kb.`)
      }
   }

    let res = await fetch("/api/" + (form_type.value ? "signup" : "login"), {
        method: "POST",
         body: formdata
    })

    let json = await res.json()

   loading.value = false
    if (res.status == 200) {
        alert(`${form_type.value ? "Registered" : "Logged in"} successfully`)
        store.dispatch("setUser", json.user) 
        router.push("/")
    } else {
        alert(`Unable to ${form_type.value ? "register" : "login"}: ${json.message}`)
    }
}

const switch_to = (type) => {             
    form_type.value = type

    // swap selected class between tabs
    document.querySelector(".tab.selected").classList.remove("selected")
    form_tab_refs[type].value.classList.add("selected")
}

</script>

<style scoped>
.login-box {
    display: flex;
    flex-direction: column;

    max-width: 300px;
    
    margin: auto;
    margin-top: 100px;
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
    background-color: #f0f0f0;
    height: 50px;
    border: none;
}

.tab p {
    text-align: center;
}

.tab.selected {
    background-color: #e4e4e4;
}

.form {
  flex: 1;
  background-color: #e4e4e4;
}

.required {
   display: inline;
   color: red;
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
}

input, label, textarea {
  font-size: 14px;
}

form button {
  padding: 12px 0;
  margin-top: 8px;
}

.loading {
   position: fixed;
   z-index: 5;
   left: 0;
   top: 0;
   width: 100vw;
   height: 100vh;
   background-color: #30303090;

   display: flex;
   justify-content: center;
   align-items: center;
}

.loading p {
   font-size: 32px;
   font-weight: bold;
   color: white;
}

</style>
