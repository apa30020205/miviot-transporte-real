const { prisma } = require("../prisma");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Duración en minutos: 15 min a 24 h */
function parseDuracionMinutos(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 15 || n > 24 * 60) return null;
  return n;
}

exports.list = async (_req, res, next) => {
  try {
    const items = await prisma.servicio.findMany({
      orderBy: { id: "desc" },
      include: { vehiculo: true, chofer: true },
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

    const item = await prisma.servicio.findUnique({
      where: { id },
      include: { vehiculo: true, chofer: true },
    });
    if (!item) return res.status(404).json({ error: "No encontrado" });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { fecha, duracionMinutos, origen, destino, estado, vehiculoId, choferId } = req.body ?? {};

    if (!fecha || !origen || !destino || !estado || vehiculoId === undefined || choferId === undefined) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const parsedFecha = parseDate(fecha);
    if (!parsedFecha) return res.status(400).json({ error: "fecha inválida (usa ISO-8601)" });

    let dur = 120;
    if (duracionMinutos !== undefined && duracionMinutos !== null && duracionMinutos !== "") {
      const parsed = parseDuracionMinutos(duracionMinutos);
      if (parsed === null) {
        return res.status(400).json({ error: "duracionMinutos inválida (15–1440)" });
      }
      dur = parsed;
    }

    const created = await prisma.servicio.create({
      data: {
        fecha: parsedFecha,
        duracionMinutos: dur,
        origen: String(origen),
        destino: String(destino),
        estado: String(estado),
        vehiculoId: Number(vehiculoId),
        choferId: Number(choferId),
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

    const { fecha, duracionMinutos, origen, destino, estado, vehiculoId, choferId } = req.body ?? {};

    let fechaValue;
    if (fecha !== undefined) {
      const parsed = parseDate(fecha);
      if (!parsed) return res.status(400).json({ error: "fecha inválida (usa ISO-8601)" });
      fechaValue = parsed;
    }

    let durValue;
    if (duracionMinutos !== undefined) {
      const parsed = parseDuracionMinutos(duracionMinutos);
      if (parsed === null) {
        return res.status(400).json({ error: "duracionMinutos inválida (15–1440)" });
      }
      durValue = parsed;
    }

    const updated = await prisma.servicio.update({
      where: { id },
      data: {
        ...(fecha !== undefined ? { fecha: fechaValue } : {}),
        ...(durValue !== undefined ? { duracionMinutos: durValue } : {}),
        ...(origen !== undefined ? { origen: String(origen) } : {}),
        ...(destino !== undefined ? { destino: String(destino) } : {}),
        ...(estado !== undefined ? { estado: String(estado) } : {}),
        ...(vehiculoId !== undefined ? { vehiculoId: Number(vehiculoId) } : {}),
        ...(choferId !== undefined ? { choferId: Number(choferId) } : {}),
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

    await prisma.servicio.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err?.code === "P2025") return res.status(404).json({ error: "No encontrado" });
    next(err);
  }
};

