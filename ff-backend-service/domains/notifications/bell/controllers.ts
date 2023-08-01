import Dataset from "@/domains/datasets/model";
import Notification from "./models";
import express from "express";
import PullRequest from "@/domains/pullRequests/model";
import IBellNotification from "./interface";
import User from "@/domains/users/models/UserModel";


export async function getNotifications(
  req: express.Request,
  res: express.Response
) {
  let user = req.user!;

  let notification = await Notification.findOneAndUpdate(
    {
      user: user?._id,
    },
    {},
    {
      upsert: true,
    }
  ).exec();

  if (!notification) {
    notification = await Notification.findOne({
      user: user?._id,
    }).exec(); // This would only happen if the user never had a notification document created for them
  }

  // get all pull-requests that the user is involved in... (As a dataset owner)
  let datasets = await Dataset.find({
    user: user?._id,
  });

  // we can now get all the pull requests that are related to the datasets that the user owns
  let pullRequests = await PullRequest.find({
    dataset: {
      $in: datasets.map((dataset) => dataset._id),
    },
  }).sort({ createdAt: -1 }).exec()

  let bellNotification: IBellNotification[] = [];

  for (let pullRequest of pullRequests) {
    let pullRequestUser = await User.findById(pullRequest.user).exec();
    let dataset = datasets.find(
      (dataset) => dataset._id.toString() === pullRequest.dataset._id.toString()
    );  

    bellNotification.push({
      createdAt: pullRequest.createdAt,
      target: user?._id,
      text: `${pullRequestUser?.fullName} has requested to make changes to your dataset ${dataset?.name}`,
      link: `/marketplace/${dataset?._id}/contributions/${pullRequest._id}`,
      origin: {
        id: pullRequestUser!._id,
        name: pullRequestUser!.fullName,
        picture: pullRequestUser!.profilePhoto?.url ?? "gradient",
      },
      picture: "gradient",
      resource: "Contributions",
    });
  };


  return res.json({
    success: true,
    data: {
        notifications: bellNotification,
        lastChecked: notification?.lastSent
    }
  });
}

export async function markNotificationsAsRead(
  req: express.Request,
  res: express.Response
) {
  let user = req.user!;

  let notification = await Notification.findOneAndUpdate(
    {
      user: user?._id,
    },
    {
      lastSent: new Date(),
    },
    {
      upsert: true,
    }
  ).exec();

  return res.json({
    success: true,
    data: {
      lastChecked: notification?.lastSent,
    },
  });
}
