const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = './play_store_assets';
const files = fs.readdirSync(srcDir);

async function resize() {
    for (const file of files) {
        if (!file.endsWith('.png')) continue;

        const inputPath = path.join(srcDir, file);
        let outputWidth, outputHeight;
        let outputPath;

        if (file.includes('feature_graphic')) {
            outputWidth = 1024;
            outputHeight = 500;
            outputPath = path.join(srcDir, 'feature_graphic_final.png');
        } else if (file.includes('icon')) {
            outputWidth = 512;
            outputHeight = 512;
            outputPath = path.join(srcDir, 'icon_final.png');
        } else {
            continue;
        }

        try {
            await sharp(inputPath)
                .resize(outputWidth, outputHeight, {
                    fit: 'cover',
                    position: 'center'
                })
                .toFile(outputPath);
            console.log(`Resized ${file} to ${outputWidth}x${outputHeight} -> ${outputPath}`);
        } catch (error) {
            console.error(`Error resizing ${file}:`, error);
        }
    }
}

resize();
