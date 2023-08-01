import sharp from 'sharp'
import sizeOf from 'image-size'

export function getDimensionsOfImage (buffer: Buffer) {
  const dimensions = sizeOf(buffer)
  const width = dimensions.width ?? 1000
  const height = dimensions.height ?? 800

  if (width > height) {
    return width > 1000 ? 1000 : width
  } else {
    return height > 800 ? 800 : height
  }
}

export async function transformImage (imageBuffer: Buffer) {
  const dimension = getDimensionsOfImage(imageBuffer)
  return await sharp(imageBuffer)
    .resize(dimension === 1000 ? { width: 1000 } : { height: 800 })
    .toFormat('jpeg', {})
    .toBuffer()
}