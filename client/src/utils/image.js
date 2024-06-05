export const compress_image = (file, dim, quality) => {
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

