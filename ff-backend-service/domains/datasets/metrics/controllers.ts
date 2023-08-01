import { Request, Response } from "express";
import { ObjectId } from "@/utils/abbreviations";
import { z } from "zod";
import ActivityService from "./service";
import { InvalidArgumentsError } from "@/utils/errors";

export async function getDatasetMetrics(req: Request, res: Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.datasetId));
  const service = new ActivityService(req.user!);
  const views = await service.getDatasetViewCount(id);
  const downloads = await service.getDatasetDownloadCount(id);
  res.json({
    success: true,
    data: {
      views: views,
      downloads: downloads,
    },
  });
}

export async function getDatasetActivity(req: Request, res: Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.datasetId));
  const service = new ActivityService(req.user!);
  const result = await service.getDatasetActivity(id, z.number().positive().optional().parse(req.query.length));
  res.json({
    success: true,
    data: result,
  });
}

export async function addMetricsToDataset(req: Request, res: Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.datasetId));
  const type = req.body.type;
  const service = new ActivityService(req.user!);
  if (type == "view") {
    await service.addViewToDataset(id);
  } else if (type == "download") {
    await service.addDownloadToDataset(id);
  } else {
    throw new InvalidArgumentsError(
      "Please specify the type of activity being added (either view or download) as a query parameter"
    );
  }
  res.json({ success: true });
}
