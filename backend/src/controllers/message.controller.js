import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import { v2 as cloudinary } from "cloudinary";
import { getReceiverSocketId, io } from "../lib/socket.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, fileData, type } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    console.log("Backend: sendMessage - Incoming Request Body:", {
      content,
      type,
      fileData: fileData ? fileData.substring(0, 50) + "..." : "N/A",
    });
    console.log(
      "Backend: sendMessage - SenderId (from auth):",
      senderId.toString()
    );

    let messageType = type || "text";
    let uploadedFileUrl = null;
    let uploadedFileType = null;

    if (!content && !fileData) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    if (fileData) {
      try {
        let cloudinaryResourceType;
        if (messageType === "image") {
          cloudinaryResourceType = "image";
        } else if (messageType === "voice") {
          cloudinaryResourceType = "video";
        } else {
          cloudinaryResourceType = "auto";
        }

        const uploadResponse = await cloudinary.uploader.upload(fileData, {
          resource_type: cloudinaryResourceType,
          folder: "chat_app_media",
        });
        uploadedFileUrl = uploadResponse.secure_url;
        uploadedFileType = fileData.split(",")[0].split(":")[1].split(";")[0];
        console.log(
          "Backend: Cloudinary Upload Success. URL:",
          uploadedFileUrl
        );
      } catch (uploadError) {
        console.error(
          "Backend: Cloudinary upload failed:",
          uploadError.message
        );
        return res
          .status(500)
          .json({ error: "Failed to upload file to Cloudinary" });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      content:
        content || (messageType !== "text" ? `${messageType} message` : null),
      fileUrl: uploadedFileUrl,
      fileType: uploadedFileType,
      type: messageType,
    });

    await newMessage.save();
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "username profilePic")
      .lean();
    console.log(
      "Backend: sendMessage - Populated Message Object (before response/emit):"
    );
    console.log(JSON.stringify(populatedMessage, null, 2));

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
      console.log(
        `Backend: Emitting 'newMessage' to receiver ${receiverSocketId}`
      );
    }

    res.status(201).json(populatedMessage);
    console.log(
      "Backend: Sending 201 response with populated message to sender."
    );
  } catch (error) {
    console.error("Backend: Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
