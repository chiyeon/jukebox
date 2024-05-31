// UPLOAD.JS
// FNS FOR PREPARING DATA & SUBMITTING TO WEB SERVER

// given a file, compress it to a square dim x dim
// at a given quality [0.0, 1.0]
const compress_image = (file, dim, quality) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
         const img = new Image()
            
         img.onload = () => {
             const canvas = document.createElement('canvas')
             let width = img.width
             let height = img.height
             
             if (width > height) {
                 if (width > dim) {
                     height *= dim / width
                     width = dim
                 }
             } else {
                 if (height > dim) {
                     width *= dim / height
                     height = dim
                 }
             }
             
             canvas.width = dim
             canvas.height = dim
             const ctx = canvas.getContext('2d')
             ctx.imageSmoothingEnabled = true;
             ctx.drawImage(img, 0, 0, dim, dim)
             
             canvas.toBlob(blob => {
                 const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '.webp', { type: 'image/webp' });
                 resolve(compressedFile);
             }, 'image/webp', quality)
         }
         
         img.src = e.target.result;
      }
        
      reader.onerror = (error) => {
         reject(error);
      }
     
      reader.readAsDataURL(file);
   })
}

// load given inputs,
// check & compress/format
// submit to backend
const upload = async () => {
   console.log("Attempting upload")
   const trackinput = document.querySelector("#track-upload")
   const albuminput = document.querySelector("#track-album")
   const title = document.querySelector("#track-title").value

   if (trackinput.files.length == 0) {
      return alert("Select a file to upload")
   }

   if (title == "" || title == undefined) {
      return alert("Invalid title")
   }

   console.log("Loading & compressing files")
   let url = "http://localhost:8080/upload"
   let formdata = new FormData()
   let track = trackinput.files[0]
   let album = albuminput.files.length != 0 ? await compress_image(albuminput.files[0], 512, 0.9) : undefined

   if (album) console.log(`Compressed album from ${albuminput.files[0].size}kb to ${album.size}kb.`)

   formdata.append("track", track)
   if (album) formdata.append("album", album)
   formdata.append("title", title)

   console.log("Submitting files")
   try {
      let res = await fetch(url, {
         method: "POST",
         credentials: "include",
         body: formdata
      })

      if (res.status == 200) {
         alert("Successfully uploaded!")
      } else {
         throw res.statusText
      }
   } catch (e) {
      alert("Error: " + e)
   }


}

