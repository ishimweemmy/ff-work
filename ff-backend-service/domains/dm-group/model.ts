import { ObjectId } from "@/utils/abbreviations";
import mongoose, { mongo } from "mongoose";
import MongoPaging, {
  MongooseCursorPaginationModel,
} from "mongo-cursor-pagination";
import { MODEL_NAMES } from "@/configuration";
import z from "zod";

export interface GroupDM {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  users: ObjectId[];
  invitedUsers: ObjectId[];
}

const DmGroupSchema = new mongoose.Schema<GroupDM>({
  createdAt: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: MODEL_NAMES.user,
    required: true,
  },
  invitedUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: MODEL_NAMES.user,
    required: true,
  },
});

DmGroupSchema.plugin(MongoPaging.mongoosePlugin);

const GroupDM = mongoose.model<GroupDM, MongooseCursorPaginationModel<GroupDM>>(
  MODEL_NAMES.dmGroup,
  DmGroupSchema
);

export default GroupDM;
