import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mysql } from '../lib/mysql';

export default async function uploadData(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/data',
    {
      schema: {
        body: z.object({
          boardId: z.number(),
          temperature: z.number(),
          accelerationX: z.number(),
          accelerationY: z.number(),
          accelerationZ: z.number(),
        }),
      },
    },
    (request, reply) => {
      const {
        boardId,
        temperature,
        accelerationX,
        accelerationY,
        accelerationZ,
      } = request.body;

      mysql.getConnection((databaseError, databaseConnection) => {
        databaseConnection.release();

        if (databaseError) {
          return reply.code(500).send({ databaseError: databaseError });
        }

        const query = `INSERT INTO data (
          board_id,
          temperature,
          acceleration_x,
          acceleration_y,
          acceleration_z
        ) VALUES (
          ?, 
          ?, 
          ?, 
          ?, 
          ?
        )`;

        databaseConnection.query(
          query,
          [boardId, temperature, accelerationX, accelerationY, accelerationZ],
          (queryError) => {
            if (queryError) {
              return reply.code(501).send({ queryError: queryError });
            }
          }
        );

        return reply.code(200).send('Data uploaded successfully.');
      });
    }
  );
}
