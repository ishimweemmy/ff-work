import User from '@/domains/users/models/UserModel';
import MongoPaging from 'mongo-cursor-pagination';
import mongoose from 'mongoose';

export interface IMessage {
    _id: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.modelName,
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.modelName,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date()
    }
})

MessageSchema.plugin(MongoPaging.mongoosePlugin)

const Message = mongoose.model<IMessage>('Message', MessageSchema)
User.syncIndexes().then();

export default Message
