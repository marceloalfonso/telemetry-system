import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mysql } from '../lib/mysql';

export default async function uploadDeviceToken(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/devices',
    {
      schema: {
        body: z.object({
          token: z.string(),
        }),
      },
    },
    (request, reply) => {
      const { token } = request.body;

      mysql.getConnection((databaseError, databaseConnection) => {
        if (databaseError) {
          return reply.code(500).send({ databaseError: databaseError });
        }

        databaseConnection.query(
          'INSERT INTO devices (token) VALUES (?)',
          [token],
          (queryError) => {
            databaseConnection.release();

            if (queryError) {
              return reply.code(500).send({ queryError: queryError });
            }

            return reply.code(200).send('Device token uploaded successfully.');
          }
        );
      });
    }
  );
}
