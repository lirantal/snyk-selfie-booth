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

    // Read Hackers scene image from local file
    const baseImagePath = join(process.cwd(), 'data', 'base-image.jpg')
    const baseImageBuffer = await readFile(baseImagePath)
    const baseImageUint8Array = new Uint8Array(baseImageBuffer)

    // Use AI SDK with generateText for Gemini 2.5 Flash Image (Nano Banana)
    // This model supports image editing/generation with input images
    const googleProvider = createGoogleGenerativeAI({ apiKey: apiKey })
    
    // debug logs
    // console.log('=== AI SDK Request Debug ===')
    // console.log('Model: gemini-2.5-flash-image')
    // console.log('Base image size:', baseImageUint8Array.length, 'bytes')
    // console.log('User image size:', userImageUint8Array.length, 'bytes')
    // console.log('User image type:', imageFile.type || 'image/jpeg')
    
    const result = await generateText({
      model: googleProvider('gemini-2.5-flash-image'),
      prompt: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'COMPOSITION INSTRUCTIONS: Generate a single, hyper-realistic, high-detail selfie photograph. The foundational scene and background must be derived exclusively from the BASE background image (shown below); this setting serves as the environment for the final image.'
            },
            {
              type: 'text',
              text: '[BASE Background Image]'
            },
            {
              type: 'image',
              image: baseImageUint8Array,
              mediaType: 'image/jpeg'
            },
            {
              type: 'text',
              text: 'Integrate the person from the user selfie image (shown below) into the BASE background image, placing them standing close together. The final image should have a selfie-style perspective (close-up, intimate framing) as if taken from a first-person viewpoint, but DO NOT include any visible hands, smartphones, or camera equipment in the frame. The image should appear as if the camera is invisible, capturing a natural moment without showing the device or hand holding it.'
            },
            {
              type: 'text',
              text: '[User Selfie Image]'
            },
            {
              type: 'image',
              image: userImageUint8Array,
              mediaType: imageFile.type || 'image/jpeg'
            },
            {
              type: 'text',
              text: 'Both individuals must be smiling, looking directly into the lens, and their precise facial likenesses, clothing, and details from tyouheir respective input images must be accurately and seamlessly preserved. Maintain consistent, warm, soft, natural daylight and ensure the overall vibe is joyful and spontaneous. The final image must appear as a spontaneous, single-shot photograph taken in the original environment of the BASE background image. IMPORTANT: Do not include any visible hands, smartphones, phones, or camera equipment in the final image - only show the people and background.'
            }
          ]
        }
      ]
    })

    // Debug: Log the full response structure
    // console.log('=== AI SDK Response Debug ===')
    // console.log('Result type:', typeof result)
    // console.log('Result.files length:', result.files?.length)
    // console.log('Result.text:', result.text)
    // console.log('Result.text length:', result.text?.length)
    
    // Debug: Log the files array details
    // if (result.files && Array.isArray(result.files)) {
    //   console.log('Files array details:')
    //   result.files.forEach((file: any, index: number) => {
    //     console.log(`  File ${index}:`, {
    //       type: typeof file,
    //       keys: Object.keys(file || {}),
    //       mediaType: file?.mediaType,
    //       hasUint8Array: !!file?.uint8Array,
    //       uint8ArrayLength: file?.uint8Array?.length
    //     })
    //   })
    // }
    
    // Debug: Log the token usage
    // if ((result as any).usage) {
    //   console.log('Result.usage:', (result as any).usage)
    // }

    // Extract the generated image from result.files
    const generatedImageFile = result.files?.find(file => file.mediaType?.startsWith('image/'))
    
    if (!generatedImageFile) {
      console.error('=== Error: No image file found ===')
      console.error('Available files:', result.files)
      console.error('Result text content:', result.text)
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

