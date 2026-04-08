const express = require("express");
const cors = require("cors");
require("dotenv").config();

const vehiculosRoutes = require("./routes/vehiculos.routes");
const choferesRoutes = require("./routes/choferes.routes");
const serviciosRoutes = require("./routes/servicios.routes");
const tallerRoutes = require("./routes/taller.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/vehiculos", vehiculosRoutes);
app.use("/choferes", choferesRoutes);
app.use("/servicios", serviciosRoutes);
app.use("/taller", tallerRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listo en http://localhost:${port}`);
});

