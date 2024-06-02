let url = "http://localhost:8080"
const login = async (e) => {
   e.preventDefault()

   const username = document.querySelector("#login-username").value
   const password = document.querySelector("#login-password").value

   if (username == "" || password == "") return alert("Input password/username")

   const body = {
      username, password
   }

   let res = await fetch(url + "/login", {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
   })

   let json = await res.json()

   if (res.status == 200) {
      sessionStorage.setItem("user", JSON.stringify(json.user))
      goto("/")
   } else {
      alert(json.message)      
   }
}

const register = async (e) => {
   e.preventDefault()

   const username = document.querySelector("#login-username").value
   const password = document.querySelector("#login-password").value

   if (username == "" || password == "") return alert("Input password/username")

   const body = {
      username, password
   }

   let res = await fetch(url + "/signup", {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
   })

   let json = await res.json()

   if (res.status == 200) {
      sessionStorage.setItem("user", JSON.stringify(json.user))
      goto("/")
   } else {
      alert(json.message)      
   }
}