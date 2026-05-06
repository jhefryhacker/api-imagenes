const express = require('express');
const app = express();

app.use(express.json());

app.get('/hola', (req, res) => {
  res.json({ message: 'hola, como estas?' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor redy mi jefer ${PORT}`);
});

module.exports = app;