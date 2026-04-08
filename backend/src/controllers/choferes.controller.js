const { prisma } = require("../prisma");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

exports.list = async (_req, res, next) => {
  try {
    const items = await prisma.chofer.findMany({ orderBy: { id: "desc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const item = await prisma.chofer.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "No encontrado" });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { nombre, licencia, estado } = req.body ?? {};

    if (!nombre || !licencia || !estado) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const created = await prisma.chofer.create({
      data: {
        nombre: String(nombre),
        licencia: String(licencia),
        estado: String(estado),
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

    const { nombre, licencia, estado } = req.body ?? {};

    const updated = await prisma.chofer.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: String(nombre) } : {}),
        ...(licencia !== undefined ? { licencia: String(licencia) } : {}),
        ...(estado !== undefined ? { estado: String(estado) } : {}),
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

    await prisma.chofer.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err?.code === "P2025") return res.status(404).json({ error: "No encontrado" });
    next(err);
  }
};

