import express from 'express'
import 'express-async-errors'
import * as config from '@/utils/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as middleware from '@/middlewares/middleware'
import mongoose from 'mongoose'
import expressWs from 'express-ws-routes'
import activatePassport from '@/domains/users/controllers/PassportController'
import webRouter from '@/routes/web/web'
import cliRouter from '@/domains/cli/routes'
import microservicesRouter from '@/routes/microservices/microservices'
import rpcServer from '@/utils/rpc/rpcServer'
import http from 'http'
import { Server } from 'socket.io'
import { messageEvents } from './domains/messages/messages.event'


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
messageEvents(io);

app.use(cors(config.CORS_OPTIONS));
app.use(middleware.expansionQuery);
app.use(middleware.paginationQuery);
app.use(middleware.sortQuery);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(middleware.logger);
app.use(cookieParser());
app.enable('trust proxy');
app.set('view engine', 'ejs');
activatePassport(app);

console.info('connecting to', config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI, { dbName: config.MONGO_DB_NAME })
  .then(() => {
    console.info('connected to MongoDB');
  })
  .catch(() => {
    console.error('error connecting to MongoDB');
  });

app.use('/api', webRouter)
app.use('/magic', microservicesRouter)
app.use('/cli', cliRouter)
app.post("/json-rpc", async (req, res) => {
  const jsonRequest = req.body;
  const response = await rpcServer.receive(jsonRequest, {});
  if (response) {
    res.json(response);
  } else {
    res.sendStatus(204);
  }
})
app.use(middleware.errorHandling)

export default server;
