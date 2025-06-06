// import createServer from '@vendia/serverless-express';
// import { ExpressAdapter } from '@nestjs/platform-express';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as express from 'express';

// let cachedServer: any;

// async function bootstrapServer() {
//   const expressApp = express();
//   const adapter = new ExpressAdapter(expressApp);
//   const app = await NestFactory.create(AppModule, adapter);
//   await app.init();
//   return createServer({ app,m });
// }

// const handler = async (event: any, context: any) => {
//   if (!cachedServer) {
//     cachedServer = await bootstrapServer();
//   }
//   return proxy(cachedServer, event, context, 'PROMISE').promise;
// };

// export default handler; // ✅ Exportar como default para Vercel
