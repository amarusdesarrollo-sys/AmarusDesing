const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Configuración para diferentes tipos de imágenes
const imageConfigs = {
  hero: {
    width: 1920,
    height: 1080,
    quality: 85,
    fit: "cover",
  },
  product: {
    width: 800,
    height: 800,
    quality: 90,
    fit: "cover",
  },
  thumbnail: {
    width: 400,
    height: 400,
    quality: 80,
    fit: "cover",
  },
  gallery: {
    width: 1200,
    height: 800,
    quality: 85,
    fit: "cover",
  },
};

// Función para convertir imagen a AVIF
async function convertToAvif(inputPath, outputPath, config) {
  try {
    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: config.fit,
        position: "center",
      })
      .avif({
        quality: config.quality,
        effort: 4, // Máximo esfuerzo para mejor compresión
      })
      .toFile(outputPath);

    console.log(
      `✅ Convertido: ${path.basename(inputPath)} → ${path.basename(
        outputPath
      )}`
    );
  } catch (error) {
    console.error(`❌ Error convirtiendo ${inputPath}:`, error.message);
  }
}

// Función para procesar directorio
async function processDirectory(inputDir, outputDir, config) {
  if (!fs.existsSync(inputDir)) {
    console.log(`⚠️ Directorio no encontrado: ${inputDir}`);
    return;
  }

  // Crear directorio de salida si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir);
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Procesar subdirectorio recursivamente
      await processDirectory(filePath, path.join(outputDir, file), config);
    } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
      // Convertir imagen
      const outputPath = path.join(outputDir, path.parse(file).name + ".avif");
      await convertToAvif(filePath, outputPath, config);
    }
  }
}

// Función principal
async function main() {
  const baseDir = path.join(__dirname, "..");
  const imagesDir = path.join(baseDir, "public", "images");

  console.log("🚀 Iniciando conversión a AVIF...\n");

  // Procesar diferentes tipos de imágenes
  const tasks = [
    {
      input: path.join(imagesDir, "products"),
      output: path.join(imagesDir, "optimized", "products"),
      config: imageConfigs.product,
    },
    {
      input: path.join(imagesDir, "heroes"),
      output: path.join(imagesDir, "optimized", "heroes"),
      config: imageConfigs.hero,
    },
    {
      input: path.join(imagesDir, "gallery"),
      output: path.join(imagesDir, "optimized", "gallery"),
      config: imageConfigs.gallery,
    },
    {
      input: path.join(imagesDir, "artisans"),
      output: path.join(imagesDir, "optimized", "artisans"),
      config: imageConfigs.thumbnail,
    },
    {
      input: path.join(imagesDir, "about"),
      output: path.join(imagesDir, "optimized", "about"),
      config: imageConfigs.gallery,
    },
  ];

  for (const task of tasks) {
    console.log(`📁 Procesando: ${path.relative(baseDir, task.input)}`);
    await processDirectory(task.input, task.output, task.config);
    console.log("");
  }

  console.log("✨ ¡Conversión completada!");
  console.log("\n📋 Próximos pasos:");
  console.log("1. Revisa las imágenes optimizadas en public/images/optimized/");
  console.log("2. Actualiza los componentes para usar las imágenes AVIF");
  console.log("3. Considera implementar lazy loading para mejor rendimiento");
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertToAvif, processDirectory };
