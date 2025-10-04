import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Crear stream desde buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: `avatars/${userId}_${Date.now()}`
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          throw error;
        }
        return result;
      }
    );

    // Escribir buffer al stream
    uploadStream.end(buffer);

    // Esperar a que termine la subida
    return new Promise((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        // El resultado se pasa en el callback, necesitamos manejarlo diferente
      });
    });

  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    throw error;
  }
}

// Función mejorada usando upload_stream con Promise
export async function uploadAvatarPromise(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convertir buffer a base64 para cloudinary
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;
    
    // Subir a Cloudinary con configuración básica
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: `avatars/${userId}_${Date.now()}`
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };

  } catch (error) {
    console.error('Error in uploadAvatarPromise:', error);
    throw error;
  }
}

// Función para eliminar avatar
export async function deleteAvatar(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}

// Función para obtener URL optimizada
export function getOptimizedAvatarUrl(publicId: string, size: number = 200): string {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto'
  });
}

export default cloudinary;
