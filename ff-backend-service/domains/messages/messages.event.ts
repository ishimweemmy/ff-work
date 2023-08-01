import { Server, Socket } from "socket.io";
import Message from "./model";

interface User {
    id: string;
    username: string;
}


export const messageEvents = (io: Server) => {

    const activeUsers: User[] = [];
    io.on("connection", (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join", async (username: string) => {
            try {
                const user: User = { id: socket.id, username };
                activeUsers.push(user);
                io.emit("userJoined", user);
                socket.emit("activeUsers", activeUsers);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
            const index = activeUsers.findIndex((user) => user.id === socket.id);
            if (index !== -1) {
                activeUsers.splice(index, 1);
                io.emit("userLeft", socket.id);
            }
        });


        socket.on("isTyping", (typingStatus: boolean) => {

            socket.broadcast.emit("userTyping", {
                userId: socket.id,
                typing: typingStatus,
            });
        });

        socket.on("sendMessage", async (data) => {
            try {
                const { content, sender, receiver } = data;
                const newMessage = await Message.create({ content, sender, receiver });

                io.emit("newMessage", newMessage);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });


        socket.on("getAllMessages", async (data) => {
            try {
                const { receiver, sender } = data;

                const allMessages = await Message.find({ $or: [{ sender, receiver }, { sender: receiver, receiver: sender }] }).sort({ createdAt: 1 });
                socket.emit("allMessages", allMessages);
            } catch (error) {
                console.error("Error getting messages:", error);
            }
        });

        socket.on("updateMessage", async (data) => {
            try {
                const { messageId, content } = data;
                const message = await Message.findByIdAndUpdate(messageId, { content }, { new: true });
                io.emit("messageUpdated", message);
            } catch (error) {
                console.error("Error getting messages:", error);
            }
        });


        socket.on("deleteMessage", async (messageId) => {
            try {
                await Message.findByIdAndDelete(messageId);
                io.emit("messageDeleted", messageId);
            } catch (error) {
                console.error("Error deleting message:", error);
            }
        });


        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
