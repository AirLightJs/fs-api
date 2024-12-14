import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import { Controller } from "./controller";
import { env } from "@env/env";

const app: Express = express();

app
  .use(cors())
  .use(express.json({ limit: env.server.limit }))
  .use((req: Request, res: Response, next: NextFunction) => {
    return req.headers.apikey === env.key ? next() : res.status(403).end();
  });

Object.entries({
  "/upload/url": Controller.uploadUrl,
  "/upload/base64": Controller.uploadBase64,
  "/fs/mkdir": Controller.mkdir,
  "/fs/ls": Controller.ls,
  "/fs/info": Controller.info,
  "/fs/rm": Controller.rm,
}).forEach(([ url, action ]) => {
  app.post(url, (req: Request, res: Response): void => {
    action(req.body)
      .then((data: any) => res.send(data))
      .catch((error: any) => res.status(400).send(error));
  });
});

app
  .all("/ping", (_req: Request, res: Response) => res.status(200).end())
  .all("*", (_req: Request, res: Response) => res.status(404).end());

app.listen(env.server.port, env.server.host, () => console.log(`Server started`));
