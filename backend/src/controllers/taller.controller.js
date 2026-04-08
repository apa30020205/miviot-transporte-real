const { prisma } = require("../prisma");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

exports.list = async (_req, res, next) => {
  try {
    const items = await prisma.taller.findMany({
      orderBy: { id: "desc" },
      include: { vehiculo: true },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const item = await prisma.taller.findUnique({
      where: { id },
      include: { vehiculo: true },
    });
    if (!item) return res.status(404).json({ error: "No encontrado" });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      vehiculoId,
      tipo,
      fechaIngreso,
      fechaSalida,
      estado,
      costo,
      descripcion,
    } = req.body ?? {};

    if (
      vehiculoId === undefined ||
      !tipo ||
      !fechaIngreso ||
      !estado ||
      costo === undefined ||
      !descripcion
    ) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const parsedIngreso = parseDate(fechaIngreso);
    if (!parsedIngreso) return res.status(400).json({ error: "fechaIngreso inválida (usa ISO-8601)" });

    let salidaValue = null;
    if (fechaSalida !== undefined && fechaSalida !== null && fechaSalida !== "") {
      const parsedSalida = parseDate(fechaSalida);
      if (!parsedSalida) return res.status(400).json({ error: "fechaSalida inválida (usa ISO-8601)" });
      salidaValue = parsedSalida;
    }

    const created = await prisma.taller.create({
      data: {
        vehiculoId: Number(vehiculoId),
        tipo: String(tipo),
        fechaIngreso: parsedIngreso,
        fechaSalida: salidaValue,
        estado: String(estado),
        costo: Number(costo),
        descripcion: String(descripcion),
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

    const {
      vehiculoId,
      tipo,
      fechaIngreso,
      fechaSalida,
      estado,
      costo,
      descripcion,
    } = req.body ?? {};

    let ingresoValue;
    if (fechaIngreso !== undefined) {
      const parsed = parseDate(fechaIngreso);
      if (!parsed) return res.status(400).json({ error: "fechaIngreso inválida (usa ISO-8601)" });
      ingresoValue = parsed;
    }

    let salidaValue;
    if (fechaSalida !== undefined) {
      if (fechaSalida === null || fechaSalida === "") {
        salidaValue = null;
      } else {
        const parsed = parseDate(fechaSalida);
        if (!parsed) return res.status(400).json({ error: "fechaSalida inválida (usa ISO-8601)" });
        salidaValue = parsed;
      }
    }

    const updated = await prisma.taller.update({
      where: { id },
      data: {
        ...(vehiculoId !== undefined ? { vehiculoId: Number(vehiculoId) } : {}),
        ...(tipo !== undefined ? { tipo: String(tipo) } : {}),
        ...(fechaIngreso !== undefined ? { fechaIngreso: ingresoValue } : {}),
        ...(fechaSalida !== undefined ? { fechaSalida: salidaValue } : {}),
        ...(estado !== undefined ? { estado: String(estado) } : {}),
        ...(costo !== undefined ? { costo: Number(costo) } : {}),
        ...(descripcion !== undefined ? { descripcion: String(descripcion) } : {}),
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

    await prisma.taller.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err?.code === "P2025") return res.status(404).json({ error: "No encontrado" });
    next(err);
  }
};

