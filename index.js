const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(express.static(path.join(__dirname, "public")));

const PRODUCTOS_FILE = path.join(__dirname, "public/productos.json");

const leerProductos = () => {
  if (!fs.existsSync(PRODUCTOS_FILE)) return [];
  return JSON.parse(fs.readFileSync(PRODUCTOS_FILE));
};

const guardarProductos = (productos) => {
  fs.writeFileSync(PRODUCTOS_FILE, JSON.stringify(productos, null, 2));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const categoria = req.params.categoria || "otros";
    const dir = path.join(__dirname, "public/images", categoria);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error("Solo se permiten imágenes"));
  },
});

// ✅ GET - Todos los productos
app.get("/productos", (req, res) => {
  res.json(leerProductos());
});

// ✅ GET - Productos por categoría
app.get("/productos/:categoria", (req, res) => {
  const productos = leerProductos();
  res.json(productos.filter((p) => p.categoria === req.params.categoria));
});

// ✅ POST - Subir producto con imagen
app.post("/subir/:categoria", upload.single("imagen"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No se subió ninguna imagen" });

  const { categoria } = req.params;
  const { nombre, precio, descripcion, cantidad } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const producto = {
    id: Date.now(),
    nombre: nombre || req.file.filename,
    precio: parseFloat(precio) || 0,
    descripcion: descripcion || "",
    cantidad: parseInt(cantidad) || 0,
    categoria,
    imagen: req.file.filename,
    url: `${baseUrl}/images/${categoria}/${req.file.filename}`,
  };

  const productos = leerProductos();
  productos.push(producto);
  guardarProductos(productos);

  res.json({ mensaje: "Producto subido correctamente", producto });
});

// ✅ PUT - Actualizar producto
app.put("/productos/:id", (req, res) => {
  const productos = leerProductos();
  const index = productos.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1)
    return res.status(404).json({ error: "Producto no encontrado" });
  productos[index] = { ...productos[index], ...req.body };
  guardarProductos(productos);
  res.json({ mensaje: "Producto actualizado", producto: productos[index] });
});

// ✅ DELETE - Eliminar producto
app.delete("/productos/:id", (req, res) => {
  let productos = leerProductos();
  const producto = productos.find((p) => p.id === parseInt(req.params.id));
  if (!producto)
    return res.status(404).json({ error: "Producto no encontrado" });
  const filePath = path.join(
    __dirname,
    "public/images",
    producto.categoria,
    producto.imagen,
  );
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  productos = productos.filter((p) => p.id !== parseInt(req.params.id));
  guardarProductos(productos);
  res.json({ mensaje: "Producto eliminado" });
});

// ✅ GET - Categorías
app.get("/categorias", (req, res) => {
  const dir = path.join(__dirname, "public/images");
  if (!fs.existsSync(dir)) return res.json([]);
  const categorias = fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isDirectory());
  res.json(categorias);
});

// ✅ GET - Admin panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

app.get("/hola", (req, res) => res.json({ message: "hola, como estas?" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
