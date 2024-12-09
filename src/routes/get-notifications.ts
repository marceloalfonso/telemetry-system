import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { mysql } from '../lib/mysql';

export default async function getNotifications(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/notifications', {}, (_, reply) => {
      mysql.getConnection((databaseError, databaseConnection) => {
        if (databaseError) {
          return reply.code(500).send({ databaseError: databaseError });
        }

        databaseConnection.query(
          'SELECT * FROM notifications ORDER BY id DESC LIMIT 10',
          (queryError, notifications) => {
            databaseConnection.release();

            if (queryError) {
              return reply.code(500).send({ queryError: queryError });
            }

            return reply.code(200).send(notifications);
          }
        );
      });
    });
}
