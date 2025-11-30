import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const apiKey = config.geminiApiKey

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'GEMINI_API_KEY is not configured'
      })
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No image file provided'
      })
    }

    // Find the image file in form data
    const imageFile = formData.find(item => item.name === 'image' && item.filename)
    
    if (!imageFile || !imageFile.data) {
      throw createError({
        statusCode: 400,
        message: 'Image file is required'
      })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (imageFile.type && !allowedTypes.includes(imageFile.type)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      })
    }

    // Convert uploaded image to Uint8Array
    const userImageUint8Array = new Uint8Array(imageFile.data)

    // Read Yoda image from local file
    const yodaImagePath = join(process.cwd(), 'data', 'yoda-sitting.jpg')
    const yodaImageBuffer = await readFile(yodaImagePath)
    const yodaImageUint8Array = new Uint8Array(yodaImageBuffer)

    // Use AI SDK with generateText for Gemini 2.5 Flash Image (Nano Banana)
    // This model supports image editing/generation with input images
    const googleProvider = createGoogleGenerativeAI({ apiKey: apiKey })
    const result = await generateText({
      model: googleProvider('gemini-2.5-flash-image'),
      prompt: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a realistic selfie photo of the person in the first image together with Yoda from Star Wars (shown in the second image), both smiling and looking at the camera. The image should look natural and photorealistic, as if taken with a smartphone camera.'
            },
            {
              type: 'image',
              image: userImageUint8Array,
              mediaType: imageFile.type || 'image/jpeg'
            },
            {
              type: 'image',
              image: yodaImageUint8Array,
              mediaType: 'image/jpeg'
            }
          ]
        }
      ]
    })

    // Extract the generated image from result.files
    const generatedImageFile = result.files?.find(file => file.mediaType?.startsWith('image/'))
    
    if (!generatedImageFile) {
      throw new Error('No image was generated in the response')
    }

    // Convert Uint8Array to base64 data URL for the frontend
    const base64String = Buffer.from(generatedImageFile.uint8Array).toString('base64')
    const dataUrl = `data:${generatedImageFile.mediaType};base64,${base64String}`
    
    return {
      success: true,
      image: dataUrl
    }
  } catch (error: any) {
    console.error('Error generating selfie:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate selfie'
    })
  }
})

