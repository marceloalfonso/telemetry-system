import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getMessaging } from 'firebase-admin/messaging';
import { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { mysql } from '../lib/mysql';

export default async function sendNotification(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/notifications',
    {
      schema: {
        body: z.object({
          dataId: z.number(),
          title: z.string(),
          body: z.string(),
        }),
      },
    },
    (request, reply) => {
      const { dataId, title, body } = request.body;

      mysql.getConnection((databaseError, databaseConnection) => {
        if (databaseError) {
          return reply.code(500).send({ databaseError: databaseError });
        }

        databaseConnection.query(
          'SELECT * FROM notifications WHERE data_id = ?',
          [dataId],
          (selectNotificationsError, notifications) => {
            databaseConnection.release();

            if (selectNotificationsError) {
              return reply
                .code(500)
                .send({ selectNotificationsError: selectNotificationsError });
            }

            notifications = notifications as RowDataPacket[];

            if (notifications.length > 0) {
              return reply
                .code(400)
                .send('Notification with this data ID was already sent.');
            }

            databaseConnection.query(
              'SELECT * FROM devices',
              async (selectDevicesError, devices) => {
                databaseConnection.release();

                if (selectDevicesError) {
                  console.error(
                    'Erro ao selecionar dispositivos:',
                    selectDevicesError
                  );
                  return reply
                    .code(500)
                    .send({ selectDevicesError: selectDevicesError });
                }

                devices = devices as RowDataPacket[];

                if (devices.length === 0) {
                  return reply.code(404).send('No devices found.');
                }

                try {
                  await getMessaging().sendEachForMulticast({
                    notification: {
                      title,
                      body,
                    },
                    tokens: devices.map((device) => device.token),
                  });

                  databaseConnection.query(
                    'INSERT INTO notifications (data_id, title, body) VALUES (?, ?, ?)',
                    [dataId, title, body],
                    (insertNotificationsError) => {
                      databaseConnection.release();

                      if (insertNotificationsError) {
                        return reply.code(500).send({
                          insertNotificationsError: insertNotificationsError,
                        });
                      }

                      return reply
                        .code(200)
                        .send('Notification sent successfully.');
                    }
                  );
                } catch (messagingError) {
                  return reply
                    .code(500)
                    .send({ messagingError: messagingError });
                }
              }
            );
          }
        );
      });
    }
  );
}
