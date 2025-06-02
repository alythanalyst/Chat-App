import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, StopCircle, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Please allow microphone access to send voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecordedVoiceNote = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    }
  };

  const clearVoiceNote = () => {
    setAudioBlob(null);
    setIsRecording(false);
    audioChunksRef.current = [];
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      if (e.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (isRecording) {
      toast.error("Please stop recording first.");
      return;
    }

    try {
      if (audioBlob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const arrayBuffer = reader.result;
          await sendMessage({
            audio: arrayBuffer,
            type: "voice",
            content: "Voice Note",
          });
          clearVoiceNote();
        };
        reader.readAsArrayBuffer(audioBlob);
      } else if (imagePreview) {
        await sendMessage({
          image: imagePreview,
          text: text.trim(),
          type: "image",
          content: text.trim() || "Image",
        });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setText("");
      } else if (text.trim()) {
        await sendMessage({
          text: text.trim(),
          type: "text",
          content: text.trim(),
        });
        setText("");
      } else {
        return;
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message.");
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="btn btn-circle btn-error animate-pulse"
            >
              <StopCircle size={24} />
            </button>
          ) : audioBlob ? (
            <>
              <button
                type="button"
                onClick={playRecordedVoiceNote}
                className="btn btn-circle btn-info"
              >
                <PlayCircle size={24} />
              </button>
              <button
                type="button"
                onClick={clearVoiceNote}
                className="btn btn-circle btn-ghost text-zinc-400"
              >
                <X size={24} />
              </button>
              <span className="flex items-center text-sm text-gray-600">
                Voice Note Ready
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="btn btn-circle btn-primary"
              disabled={!!text.trim() || !!imagePreview}
            >
              <Mic size={24} />
            </button>
          )}

          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording || !!audioBlob}
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isRecording || !!audioBlob}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || !!audioBlob}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle btn-success"
          disabled={!text.trim() && !imagePreview && !audioBlob}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
