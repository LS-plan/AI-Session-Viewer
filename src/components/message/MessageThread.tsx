import type { DisplayMessage } from "../../types";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { ToolOutputMessage } from "./ToolOutputMessage";
import { useAppStore } from "../../stores/appStore";
import { Star } from "lucide-react";

interface MessageThreadProps {
  messages: DisplayMessage[];
  source: string;
  showTimestamp: boolean;
  showModel: boolean;
  sessionId?: string;
  projectId?: string;
  filePath?: string;
  sessionTitle?: string;
  projectName?: string;
}

export function MessageThread({ messages, source, showTimestamp, showModel, sessionId, projectId, filePath, sessionTitle, projectName }: MessageThreadProps) {
  const { addBookmark, removeBookmark, isBookmarked, bookmarks } = useAppStore();

  const handleToggleBookmark = (msg: DisplayMessage, msgId: string) => {
    if (!sessionId || !projectId || !filePath) return;
    const bookmarked = isBookmarked(sessionId, msgId);
    if (bookmarked) {
      const bm = bookmarks.find(
        (b) => b.sessionId === sessionId && b.messageId === msgId
      );
      if (bm) removeBookmark(bm.id);
    } else {
      const textContent = msg.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();
      const preview = textContent.slice(0, 100) + (textContent.length > 100 ? "..." : "");
      addBookmark({
        source,
        projectId,
        sessionId,
        filePath,
        messageId: msgId,
        preview,
        sessionTitle: sessionTitle || "",
        projectName: projectName || "",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-6 space-y-6">
      {messages.map((msg, i) => {
        if (msg.role === "user") {
          const msgId = msg.uuid || `user-${i}`;
          const bookmarked = sessionId ? isBookmarked(sessionId, msgId) : false;
          return (
            <div key={msgId} data-user-msg-id={msgId} className="group/bookmark flex items-start justify-end gap-1.5">
              <div className="min-w-0">
                <UserMessage message={msg} showTimestamp={showTimestamp} />
              </div>
              {sessionId && (
                <button
                  onClick={() => handleToggleBookmark(msg, msgId)}
                  className={`mt-1 p-1 rounded shrink-0 transition-all ${
                    bookmarked
                      ? "text-yellow-500 opacity-100"
                      : "text-muted-foreground opacity-0 group-hover/bookmark:opacity-100 hover:text-yellow-500"
                  }`}
                  title={bookmarked ? "取消收藏" : "收藏此消息"}
                >
                  <Star className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
                </button>
              )}
            </div>
          );
        }
        if (msg.role === "tool") {
          return <ToolOutputMessage key={msg.uuid || i} message={msg} showTimestamp={showTimestamp} />;
        }
        return <AssistantMessage key={msg.uuid || i} message={msg} source={source} showTimestamp={showTimestamp} showModel={showModel} />;
      })}
    </div>
  );
}
