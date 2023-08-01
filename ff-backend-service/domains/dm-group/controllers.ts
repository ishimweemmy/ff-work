import express from "express";
import z from "zod";
import DmGroupService from "./service";

export async function createDmGroup(
  req: express.Request,
  res: express.Response
) {
  const users = z.array(z.string()).nonempty().parse(req.body.users);
  const result = await new DmGroupService(req.user!).createDmGroup(users);

  res.send({
    success: true,
    data: result,
  });
}

export async function acceptDmGroupInvite(
  req: express.Request,
  res: express.Response
) {
  const groupId = z.string().nonempty().parse(req.body.groupId);
  await new DmGroupService(req.user!).acceptDmGroupInvite(groupId);

  res.send({
    success: true,
  });
}
