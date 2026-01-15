const sharp = require("sharp");
const path = require("path");

// Función para optimizar una imagen específica
async function optimizeImage(inputPath, options = {}) {
  const {
    width = 800,
    height = 800,
    quality = 85,
    format = "avif",
    fit = "cover",
  } = options;

  try {
    const inputFile = path.parse(inputPath);
    const outputPath = path.join(inputFile.dir, `${inputFile.name}.${format}`);

    await sharp(inputPath)
      .resize(width, height, {
        fit: fit,
        position: "center",
      })
      .toFormat(format, {
        quality: quality,
        effort: format === "avif" ? 4 : undefined,
      })
      .toFile(outputPath);

    console.log(
      `✅ Optimizado: ${path.basename(inputPath)} → ${path.basename(
        outputPath
      )}`
    );
    return outputPath;
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
    return null;
  }
}

// Función para crear múltiples tamaños
async function createMultipleSizes(
  inputPath,
  sizes = ["thumbnail", "medium", "large"]
) {
  const sizeConfigs = {
    thumbnail: { width: 400, height: 400, quality: 80 },
    medium: { width: 800, height: 800, quality: 85 },
    large: { width: 1200, height: 1200, quality: 90 },
  };

  const results = [];

  for (const size of sizes) {
    const config = sizeConfigs[size];
    if (config) {
      const outputPath = await optimizeImage(inputPath, {
        ...config,
        format: "avif",
      });

      if (outputPath) {
        results.push({
          size,
          path: outputPath,
          width: config.width,
          height: config.height,
        });
      }
    }
  }

  return results;
}

// Función para optimizar imágenes para productos
async function optimizeProductImage(inputPath) {
  const inputFile = path.parse(inputPath);
  const outputDir = path.join(inputFile.dir, "optimized");

  // Crear directorio si no existe
  require("fs").mkdirSync(outputDir, { recursive: true });

  const results = await createMultipleSizes(inputPath);

  // También crear versión WebP para compatibilidad
  await optimizeImage(inputPath, {
    width: 800,
    height: 800,
    quality: 85,
    format: "webp",
  });

  return results;
}

// CLI usage
if (require.main === module) {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.log("Uso: node optimize-image.js <ruta-de-imagen>");
    console.log(
      "Ejemplo: node optimize-image.js public/images/products/joyeria-artesanal/anillo1.jpg"
    );
    process.exit(1);
  }

  optimizeProductImage(inputPath)
    .then((results) => {
      console.log("\n✨ Optimización completada!");
      console.log("Archivos generados:");
      results.forEach((result) => {
        console.log(
          `  - ${result.size}: ${result.width}x${result.height} → ${result.path}`
        );
      });
    })
    .catch(console.error);
}

module.exports = { optimizeImage, createMultipleSizes, optimizeProductImage };
