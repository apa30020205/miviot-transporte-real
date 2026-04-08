const { prisma } = require("../prisma");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

exports.list = async (_req, res, next) => {
  try {
    const items = await prisma.vehiculo.findMany({ orderBy: { id: "desc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const item = await prisma.vehiculo.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "No encontrado" });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { placa, modelo, estado, km_actual } = req.body ?? {};

    if (!placa || !modelo || !estado || km_actual === undefined) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const created = await prisma.vehiculo.create({
      data: {
        placa: String(placa),
        modelo: String(modelo),
        estado: String(estado),
        km_actual: Number(km_actual),
      },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const { placa, modelo, estado, km_actual } = req.body ?? {};

    const updated = await prisma.vehiculo.update({
      where: { id },
      data: {
        ...(placa !== undefined ? { placa: String(placa) } : {}),
        ...(modelo !== undefined ? { modelo: String(modelo) } : {}),
        ...(estado !== undefined ? { estado: String(estado) } : {}),
        ...(km_actual !== undefined ? { km_actual: Number(km_actual) } : {}),
      },
    });

    res.json(updated);
  } catch (err) {
    if (err?.code === "P2025") return res.status(404).json({ error: "No encontrado" });
    next(err);
  }
};

exports.deleteById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    await prisma.vehiculo.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err?.code === "P2025") return res.status(404).json({ error: "No encontrado" });
    next(err);
  }
};

