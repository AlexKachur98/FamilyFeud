import sharp from 'sharp';

const bufferImage = async (file) => {
    let imageBuffer;
    if (file.mimetype === 'image/png') {
        // Resize png image
        imageBuffer = await sharp(file.buffer)
            .resize({ width: 500, height: 500, fit: 'inside' })
            .png({ compressionLevel: 8 })
            .toBuffer();
    } else if (file.mimetype === 'image/jpeg') {
        // Resize jpeg image
        imageBuffer = await sharp(file.buffer)
            .resize({ width: 500, height: 500, fit: 'inside' })
            .jpeg({ quality: 70 })
            .toBuffer();
    }
    return imageBuffer;
}

export default bufferImage;