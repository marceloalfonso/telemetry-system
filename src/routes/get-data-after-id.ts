import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { mysql } from '../lib/mysql';

export default async function getDataAfterId(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/data/:id',
    {
      schema: {
        params: z.object({
          id: z.string(),
        }),
      },
    },
    (request, reply) => {
      const { id } = request.params;

      mysql.getConnection((databaseError, databaseConnection) => {
        if (databaseError) {
          return reply.code(500).send({ databaseError: databaseError });
        }

        databaseConnection.query(
          'SELECT * FROM data WHERE id > ?',
          [id],
          (queryError, dataAfterId) => {
            databaseConnection.release();

            if (queryError) {
              return reply.code(500).send({ queryError: queryError });
            }

            return reply.code(200).send(dataAfterId);
          }
        );
      });
    }
  );
}
