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
            <label for="username">Username</label>
            <input ref="username_ref" id="login-username" type="text" placeholder="capybara" name="username" required>

            <label for="password">Password</label>
            <input ref="password_ref" id="login-password" type="password" placeholder="passw0rd" name="password" required>
          
            <button ref="submit_button_ref" type="submit" @click="handle_submit">{{ form_type ? "Register" : "Login" }}</button>
        </form>
      </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useStore } from "vuex"
import router from "../router"

const store = useStore()
const FORM_LOGIN = 0
const FORM_REGISTER = 1

const submit_button_ref = ref(null)
const form_tab_refs = [ref(null), ref(null)]
const username_ref = ref(null)
const password_ref = ref(null)

const form_type = ref(FORM_LOGIN)

const handle_submit = async (e) => {
    e.preventDefault()

    if (username_ref.value.value == "" || password_ref.value.value == "") {
        return console.log("Invalid form")
    }

    let res = await fetch("/api/" + (form_type.value ? "signup" : "login"), {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username_ref.value.value,
            password: password_ref.value.value
        })
    })

    let json = await res.json()

    if (res.status == 200) {
        console.log(`${form_type.value ? "Registered" : "Logged in"} successfully`)
        store.dispatch("setUser", json.user) 
        router.push("/")
    } else {
        console.log(`Unable to ${form_type.value ? "register" : "login"}: ${json.message}`)
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

form {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

input[type="text"],
input[type="password"] {
  padding: 6px 4px;
  margin-bottom: 8px;
}

input, label {
  font-size: 14px;
}

form button {
  padding: 12px 0;
  margin-top: 8px;
}
</style>
