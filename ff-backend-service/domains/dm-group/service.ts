import AbstractService from "@/utils/artifacts/AbstractService";
import GroupDM from "./model";

export default class DmGroupService extends AbstractService {
  constructor(user: any) {
    super(user);
  }

  async createDmGroup(users: string[]) {
    const group = new GroupDM({
      invitedUsers: users,
      users: [this.user._id],
    });

    await group.save();

    return group;
  }

  async acceptDmGroupInvite(groupId: string) {
    const group = await GroupDM.findOne({
      _id: groupId,
    }).exec();

    if (!group) {
      throw new Error("Group not found!");
    }

    if (!group.invitedUsers.includes(this.user._id)) {
      throw new Error("You are not invited to this group!");
    }

    group.invitedUsers = group.invitedUsers.filter(
      (userId) => userId.toString() !== this.user._id.toString()
    );

    group.users.push(this.user._id);

    await group.save();

    return group;
  }
}
