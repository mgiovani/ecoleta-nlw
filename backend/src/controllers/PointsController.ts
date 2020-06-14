import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    if (!city && !uf && !items) {
      const allPoints = await knex('points').select('*');

      const serializedPoints = allPoints.map((point) => {
        return {
          ...point,
          image_url: `http://localhost:3333/uploads/points/${point.image}`,
        };
      });
      return response.json(serializedPoints);
    }

    const parsedItems = String(items)
      .split(',')
      .map((item) => Number(item.trim()));

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    const serializedPoints = points.map((point) => {
      return {
        ...point,
        image_url: `http://localhost:3333/uploads/points/${point.image}`,
      };
    });

    return response.json(serializedPoints);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex('points').where('id', id).first();
    if (!point) {
      return response.status(400).json({
        message: 'Point not found.',
      });
    }

    const serializedPoint = {
      ...point,
      image_url: `http://localhost:3333/uploads/points/${point.image}`,
    };

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id);

    return response.json({ point: serializedPoint, items });
  }

  async create(request: Request, response: Response) {
    const transaction = await knex.transaction();

    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = request.body;

    const point = {
      name,
      image: request.file.filename,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const insertedIds = await transaction('points').insert(point);
    const point_id = insertedIds[0];
    const pointItems = items
      .split(',')
      .map((item: String) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id,
        };
      });
    await transaction('point_items').insert(pointItems);

    await transaction.commit();
    return response.json({
      id: point_id,
      ...point,
      items: pointItems,
    });
  }
}

export default PointsController;
