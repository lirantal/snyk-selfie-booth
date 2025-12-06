<template>
  <div class="container">
    <div class="terminal-bg"></div>
    <div class="scanlines"></div>
    <div class="content">
      <div class="branding">
        <p class="powered-by">POWERED BY</p>
        <img src="/snyk-brand-logo.png" alt="Snyk" class="brand-logo" />
      </div>
      <header class="header">
        <h1 class="title">
          <span class="title-main">HACKERS</span>
          <span class="title-hackers">SELFIE BOOTH</span>
        </h1>
        <p class="subtitle">Hack the planet. Access granted.</p>
      </header>

      <div class="upload-section">
        <div v-if="!uploadedImage && !generatedImage" class="upload-area">
          <div class="email-section">
            <input
              v-model="userEmail"
              type="email"
              placeholder="> ENTER YOUR EMAIL"
              class="email-input"
              required
            />
            <label class="marketing-consent">
              By entering your email, you agree to receive marketing emails
            </label>
          </div>
          <label 
            for="file-upload" 
            class="upload-button"
            :class="{ disabled: !isEmailValid }"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>> UPLOAD PHOTO</span>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            @change="handleFileUpload"
            class="file-input"
            :disabled="!isEmailValid"
          />
        </div>

        <div v-if="uploadedImage && !generatedImage && !loading" class="preview-section">
          <div class="image-preview">
            <img :src="uploadedImage" alt="Your photo" class="preview-image" />
            <button @click="resetUpload" class="reset-button">×</button>
          </div>
          <button @click="generateSelfie" class="generate-button">
            > GENERATE HACKERS SELFIE
          </button>
        </div>

        <div v-if="loading" class="loading-section">
          <div class="spinner"></div>
          <p class="loading-text">> ACCESSING MAINFRAME...</p>
          <p class="loading-subtext">> COMPOSITING IMAGE...</p>
        </div>

        <div v-if="generatedImage && !loading" class="result-section">
          <div class="result-image-container">
            <img :src="generatedImage" alt="Hackers Selfie" class="result-image" />
          </div>
          <div class="result-actions">
            <button @click="downloadImage" class="download-button">> DOWNLOAD</button>
            <button @click="resetAll" class="reset-all-button">> NEW HACK</button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="clearError" class="error-button">> RETRY</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const uploadedImage = ref<string | null>(null)
const generatedImage = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const userEmail = ref<string>('')

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(userEmail.value)
})

const handleFileUpload = (event: Event) => {
  if (!isEmailValid.value) {
    error.value = 'Please enter a valid email address first.'
    return
  }

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Please upload a JPEG, PNG, or WebP image.'
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Image size must be less than 10MB.'
    return
  }

  error.value = null
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const generateSelfie = async () => {
  if (!uploadedImage.value) return

  loading.value = true
  error.value = null
  generatedImage.value = null

  try {
    // Convert base64 data URL to blob for FormData
    const base64Data = uploadedImage.value.split(',')[1]
    if (!base64Data) {
      throw new Error('Invalid image data')
    }
    const byteCharacters = atob(base64Data as string)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })
    
    const formData = new FormData()
    formData.append('image', blob, 'user-photo.jpg')

    const response = await $fetch<{ success: boolean; image: string }>('/api/generate-selfie', {
      method: 'POST',
      body: formData
    })

    if (response.success && response.image) {
      // Ensure the image is in the correct format (base64 data URL)
      generatedImage.value = response.image.startsWith('data:') 
        ? response.image 
        : `data:image/png;base64,${response.image}`
    } else {
      throw new Error('Failed to generate image')
    }
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to generate selfie. Please try again.'
    console.error('Error generating selfie:', err)
  } finally {
    loading.value = false
  }
}

const resetUpload = () => {
  uploadedImage.value = null
  const fileInput = document.getElementById('file-upload') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

const resetAll = () => {
  uploadedImage.value = null
  generatedImage.value = null
  error.value = null
  userEmail.value = ''
  const fileInput = document.getElementById('file-upload') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

const clearError = () => {
  error.value = null
}

const downloadImage = () => {
  if (!generatedImage.value) return

  const link = document.createElement('a')
  link.href = generatedImage.value
  link.download = 'hackers-selfie.jpg'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #000000;
  position: relative;
  overflow-x: hidden;
  padding: 2rem 1rem;
  font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
}

.terminal-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    repeating-linear-gradient(
      0deg,
      rgba(0, 255, 65, 0.03) 0px,
      transparent 1px,
      transparent 2px,
      rgba(0, 255, 65, 0.03) 3px
    );
  pointer-events: none;
  opacity: 0.5;
  z-index: 0;
}

.scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    transparent 50%,
    rgba(0, 255, 65, 0.03) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 0;
  animation: scanline 8s linear infinite;
}

@keyframes scanline {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

.content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.branding {
  text-align: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.brand-logo {
  max-width: 200px;
  height: auto;
  display: block;
  margin: 0 auto 0.5rem;
  filter: drop-shadow(0 0 10px rgba(0, 255, 65, 0.3));
}

.powered-by {
  color: #00ff41;
  font-size: 0.9rem;
  margin: 0;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  opacity: 0.8;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 2rem;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-family: 'Courier New', monospace;
}

.title-main {
  display: block;
  color: #00ff41;
  text-shadow: 
    0 0 10px rgba(0, 255, 65, 0.6),
    0 0 20px rgba(0, 255, 65, 0.4);
}

.title-hackers {
  display: block;
  color: #00ff41;
  text-shadow: 
    0 0 10px rgba(0, 255, 65, 0.8),
    0 0 20px rgba(0, 255, 65, 0.6),
    0 0 30px rgba(0, 255, 65, 0.4),
    0 0 40px rgba(0, 255, 65, 0.2);
  animation: glow 2s ease-in-out infinite alternate;
  font-family: 'Courier New', monospace;
}

@keyframes glow {
  from {
    text-shadow: 
      0 0 10px rgba(0, 255, 65, 0.8),
      0 0 20px rgba(0, 255, 65, 0.6),
      0 0 30px rgba(0, 255, 65, 0.4),
      0 0 40px rgba(0, 255, 65, 0.2);
  }
  to {
    text-shadow: 
      0 0 20px rgba(0, 255, 65, 1),
      0 0 30px rgba(0, 255, 65, 0.8),
      0 0 40px rgba(0, 255, 65, 0.6),
      0 0 50px rgba(0, 255, 65, 0.4);
  }
}

.subtitle {
  color: #00ff41;
  font-size: 1.2rem;
  margin-top: 1rem;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
  opacity: 0.9;
}

.upload-section {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ff41;
  border-radius: 0;
  padding: 3rem 2rem;
  box-shadow: 
    0 0 10px rgba(0, 255, 65, 0.3),
    0 0 20px rgba(0, 255, 65, 0.2),
    inset 0 0 20px rgba(0, 255, 65, 0.05);
  position: relative;
}

.upload-section::before {
  content: '>';
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #00ff41;
  font-size: 1.2rem;
  font-family: 'Courier New', monospace;
  opacity: 0.5;
}

.upload-area {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.email-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.email-input {
  width: 100%;
  padding: 1rem;
  background: #000;
  color: #00ff41;
  border: 2px solid #00ff41;
  border-radius: 0;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 
    0 0 10px rgba(0, 255, 65, 0.3),
    inset 0 0 10px rgba(0, 255, 65, 0.1);
  transition: all 0.2s ease;
}

.email-input::placeholder {
  color: rgba(0, 255, 65, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.email-input:focus {
  outline: none;
  background: rgba(0, 255, 65, 0.05);
  box-shadow: 
    0 0 20px rgba(0, 255, 65, 0.5),
    inset 0 0 20px rgba(0, 255, 65, 0.2);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
}

.email-input:invalid:not(:placeholder-shown) {
  border-color: #ff0040;
  box-shadow: 
    0 0 10px rgba(255, 0, 64, 0.3),
    inset 0 0 10px rgba(255, 0, 64, 0.1);
}

.marketing-consent {
  color: rgba(0, 255, 65, 0.7);
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  text-align: center;
  margin: 0;
  line-height: 1.4;
}

.file-input {
  display: none;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: #000;
  color: #00ff41;
  border: 2px solid #00ff41;
  border-radius: 0;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 0 10px rgba(0, 255, 65, 0.3),
    inset 0 0 10px rgba(0, 255, 65, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.upload-button:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 
    0 0 20px rgba(0, 255, 65, 0.5),
    inset 0 0 20px rgba(0, 255, 65, 0.2);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
}

.upload-button:active {
  background: rgba(0, 255, 65, 0.2);
}

.upload-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  border-color: rgba(0, 255, 65, 0.3);
  box-shadow: 
    0 0 5px rgba(0, 255, 65, 0.1),
    inset 0 0 5px rgba(0, 255, 65, 0.05);
}

.upload-button.disabled:hover {
  background: #000;
  box-shadow: 
    0 0 5px rgba(0, 255, 65, 0.1),
    inset 0 0 5px rgba(0, 255, 65, 0.05);
  text-shadow: none;
}

.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.image-preview {
  position: relative;
  border: 2px solid #00ff41;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 
    0 0 15px rgba(0, 255, 65, 0.3),
    inset 0 0 15px rgba(0, 255, 65, 0.1);
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  display: block;
}

.reset-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.8);
  color: #ff0040;
  border: 2px solid #ff0040;
  border-radius: 0;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Courier New', monospace;
  box-shadow: 0 0 10px rgba(255, 0, 64, 0.3);
}

.reset-button:hover {
  background: rgba(255, 0, 64, 0.2);
  box-shadow: 0 0 15px rgba(255, 0, 64, 0.6);
}

.generate-button {
  padding: 1rem 2.5rem;
  background: #000;
  color: #00ff41;
  border: 2px solid #00ff41;
  border-radius: 0;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 0 10px rgba(0, 255, 65, 0.3),
    inset 0 0 10px rgba(0, 255, 65, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.generate-button:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 
    0 0 20px rgba(0, 255, 65, 0.5),
    inset 0 0 20px rgba(0, 255, 65, 0.2);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
}

.loading-section {
  text-align: center;
  padding: 3rem 2rem;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 255, 65, 0.2);
  border-top-color: #00ff41;
  border-radius: 0;
  margin: 0 auto 1.5rem;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #00ff41;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
}

.loading-subtext {
  color: #00ff41;
  font-size: 1rem;
  margin-top: 0.5rem;
  font-family: 'Courier New', monospace;
  opacity: 0.7;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
}

.result-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.result-image-container {
  border-radius: 0;
  overflow: hidden;
  box-shadow: 
    0 0 20px rgba(0, 255, 65, 0.4),
    inset 0 0 20px rgba(0, 255, 65, 0.1);
  border: 2px solid #00ff41;
}

.result-image {
  max-width: 100%;
  max-height: 600px;
  display: block;
}

.result-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.download-button,
.reset-all-button {
  padding: 0.875rem 2rem;
  border: 2px solid #00ff41;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.download-button {
  background: #000;
  color: #00ff41;
  box-shadow: 
    0 0 10px rgba(0, 255, 65, 0.3),
    inset 0 0 10px rgba(0, 255, 65, 0.1);
}

.download-button:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 
    0 0 20px rgba(0, 255, 65, 0.5),
    inset 0 0 20px rgba(0, 255, 65, 0.2);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
}

.reset-all-button {
  background: #000;
  color: #00ff41;
  box-shadow: 
    0 0 10px rgba(0, 255, 65, 0.3),
    inset 0 0 10px rgba(0, 255, 65, 0.1);
}

.reset-all-button:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 
    0 0 20px rgba(0, 255, 65, 0.5),
    inset 0 0 20px rgba(0, 255, 65, 0.2);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
}

.error-message {
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #ff0040;
  border-radius: 0;
  color: #ff0040;
  font-family: 'Courier New', monospace;
  box-shadow: 
    0 0 15px rgba(255, 0, 64, 0.3),
    inset 0 0 15px rgba(255, 0, 64, 0.1);
}

.error-message p {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.error-button {
  padding: 0.75rem 1.5rem;
  background: #000;
  color: #ff0040;
  border: 2px solid #ff0040;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 
    0 0 10px rgba(255, 0, 64, 0.3),
    inset 0 0 10px rgba(255, 0, 64, 0.1);
}

.error-button:hover {
  background: rgba(255, 0, 64, 0.1);
  box-shadow: 
    0 0 20px rgba(255, 0, 64, 0.5),
    inset 0 0 20px rgba(255, 0, 64, 0.2);
  text-shadow: 0 0 10px rgba(255, 0, 64, 0.8);
}

@media (max-width: 640px) {
  .brand-logo {
    max-width: 150px;
  }

  .powered-by {
    font-size: 0.75rem;
  }

  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .upload-section {
    padding: 2rem 1.5rem;
  }

  .result-actions {
    flex-direction: column;
    width: 100%;
  }

  .download-button,
  .reset-all-button {
    width: 100%;
  }
}
</style>

