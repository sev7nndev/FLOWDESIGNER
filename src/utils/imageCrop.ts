/**
 * Utility to crop image to content (remove transparent/white borders)
 */

export const cropImageToContent = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            
            // Draw image to temp canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) {
                reject(new Error('Could not get temp canvas context'));
                return;
            }
            
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
            const data = imageData.data;
            
            // Find content bounds
            let minX = img.width;
            let minY = img.height;
            let maxX = 0;
            let maxY = 0;
            
            for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                    const i = (y * img.width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // Check if pixel is not white/transparent (content)
                    const isContent = a > 10 && !(r > 240 && g > 240 && b > 240);
                    
                    if (isContent) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            
            // Add small padding
            const padding = 10;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(img.width, maxX + padding);
            maxY = Math.min(img.height, maxY + padding);
            
            const cropWidth = maxX - minX;
            const cropHeight = maxY - minY;
            
            // Create cropped canvas
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            ctx.drawImage(img, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            // Return cropped base64
            resolve(canvas.toDataURL('image/png', 1.0));
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64Image;
    });
};
