   const convert_wav_to_mp3 = (file) => {
      return new Promise((resolve, reject) => {
         const reader = new FileReader()

         reader.onload = (e) => {
            let wavdata = e.target.result
            let mp3encoder = lamejs.Mp3Encoder(2, 48000, 320)

            let samples = new Int16Array(wavdata)
            let sampleblocksize = 1152
            let mp3data = []

            for (let i = 0; i < samples.length; i += sampleblocksize) {
               let samplechunk = samples.subarray(i, i + sampleblocksize)
               let mp3buf = mp3encoder.encodeBuffer(samplechunk)
               if (mp3buf.length > 0) { mp3data.push(mp3buf) }
            }

            let mp3buf = mp3encoder.flush()
            if (mp3buflength > 0) { mp3data.push(mp3buf) }

            let blob = new Blob(mp3data, { type: "audio/mp3" })
            let filename = file.name.replace(/\.wav$/, ".mp3")
            let convertedfile = new File([blob], filename, { type: "audio/mp3" })

            resolve(convertedfile)
         }
         reader.onerror = (error) {
            reject(error)
         }

         reader.readAsArrayBuffer(file)
      })
   }
