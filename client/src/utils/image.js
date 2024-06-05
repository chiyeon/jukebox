export const compress_image = (file, dim, quality) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
         const img = new Image()
            
         img.onload = () => {
             const canvas = document.createElement('canvas')
             let width = img.width
             let height = img.height
            let newsize

          if (width < height) {
              newsize = dim / width * height;
              width = dim;
              height = newsize;
          } else {
              newsize = dim / height * width;
              width = newsize;
              height = dim;
          }

            canvas.width = dim
            canvas.height = dim

             const ctx = canvas.getContext('2d')
             var offsetX = (dim - width) / 2;
             var offsetY = (dim - height) / 2;
             ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, width, height);
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

