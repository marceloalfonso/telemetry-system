import cors from '@fastify/cors';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { cert, initializeApp } from 'firebase-admin/app';
import getData from './routes/get-data';
import getDataAfterId from './routes/get-data-after-id';
import getNotifications from './routes/get-notifications';
import sendNotification from './routes/send-notification';
import uploadData from './routes/upload-data';
import uploadDeviceToken from './routes/upload-device-token';

const app = fastify();

app.register(cors, {
  origin: '*',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'
);

initializeApp({
  credential: cert(serviceAccount),
});

app.register(uploadData);
app.register(getData);
app.register(getDataAfterId);
app.register(uploadDeviceToken);
app.register(sendNotification);
app.register(getNotifications);

app
  .listen({
    host: 'RENDER' in process.env ? '0.0.0.0' : 'localhost',
    port: process.env.PORT ? Number(process.env.PORT) : 8080,
  })
  .then(() => {
    console.log('Server running!');
  });
