const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const categoria = req.params.categoria || "otros";
    const dir = path.join(__dirname, "public/images", categoria);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + path.extname(file.originalname);
    cb(null, nombre);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error("Solo se permiten imágenes"));
  }
});

app.get("/categorias", (req, res) => {
  const dir = path.join(__dirname, "public/images");
  if (!fs.existsSync(dir)) return res.json([]);
  const categorias = fs.readdirSync(dir).filter(f =>
    fs.statSync(path.join(dir, f)).isDirectory()
  );
  res.json(categorias);
});

app.get("/imagenes/:categoria", (req, res) => {
  const { categoria } = req.params;
  const dir = path.join(__dirname, "public/images", categoria);

  if (!fs.existsSync(dir)) return res.status(404).json({ error: "Categoría no encontrada" });

  const archivos = fs.readdirSync(dir);
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const imagenes = archivos.map(file => ({
    nombre: file,
    url: `${baseUrl}/images/${categoria}/${file}`,
    categoria
  }));

  res.json(imagenes);
});

app.get("/imagenes", (req, res) => {
  const dir = path.join(__dirname, "public/images");
  if (!fs.existsSync(dir)) return res.json([]);

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const resultado = [];

  fs.readdirSync(dir).forEach(categoria => {
    const catDir = path.join(dir, categoria);
    if (fs.statSync(catDir).isDirectory()) {
      fs.readdirSync(catDir).forEach(file => {
        resultado.push({
          nombre: file,
          url: `${baseUrl}/images/${categoria}/${file}`,
          categoria
        });
      });
    }
  });

  res.json(resultado);
});

app.post("/subir/:categoria", upload.single("imagen"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se subió ninguna imagen" });

  const { categoria } = req.params;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    mensaje: "Imagen subida correctamente",
    url: `${baseUrl}/images/${categoria}/${req.file.filename}`,
    categoria
  });
});

app.post("/url/:categoria", (req, res) => {
  const { categoria } = req.params;
  const { url, nombre } = req.body;

  if (!url) return res.status(400).json({ error: "Se requiere una URL" });

  const dir = path.join(__dirname, "public/images", categoria);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const refFile = path.join(dir, "_urls.json");
  const refs = fs.existsSync(refFile) ? JSON.parse(fs.readFileSync(refFile)) : [];
  refs.push({ nombre: nombre || url, url });
  fs.writeFileSync(refFile, JSON.stringify(refs, null, 2));

  res.json({ mensaje: "URL guardada", url, categoria });
});

app.delete("/imagenes/:categoria/:nombre", (req, res) => {
  const { categoria, nombre } = req.params;
  const filePath = path.join(__dirname, "public/images", categoria, nombre);

  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Imagen no encontrada" });

  fs.unlinkSync(filePath);
  res.json({ mensaje: "Imagen eliminada" });
});

app.get("/hola", (req, res) => res.json({ message: "hola, como estas?" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));