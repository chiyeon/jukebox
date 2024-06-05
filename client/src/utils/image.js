export const compress_image = (file, dim, quality) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
         const img = new Image()
            
         img.onload = () => {
             const canvas = document.createElement('canvas')
             let width = img.width
             let height = img.height
              let size = Math.min(width, height, dim);

              // Calculate the scale factor to fit the image into the square
              const scaleRatio = size / Math.min(width, height)

              canvas.width = dim;
              canvas.height = dim;

              // Calculate the position to center the image
              const offsetX = (dim - width * scaleRatio) / 2;
              const offsetY = (dim - height * scaleRatio) / 2;

             const ctx = canvas.getContext('2d')
             ctx.imageSmoothingEnabled = true;
              ctx.drawImage(
                img,
                0,
                0,
                width,
                height,
                offsetX,
                offsetY,
                width * scaleRatio,
                height * scaleRatio 
           );

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

