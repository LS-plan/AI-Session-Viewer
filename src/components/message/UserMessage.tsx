import type { DisplayMessage } from "../../types";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatTime } from "./utils";

interface Props {
  message: DisplayMessage;
}

export function UserMessage({ message }: Props) {
  return (
    <div className="flex gap-3 bg-primary/5 rounded-lg p-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">用户</span>
          {message.timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
        {message.content.map((block, i) => {
          if (block.type === "text") {
            return (
              <div key={i} className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.text}
                </ReactMarkdown>
              </div>
            );
          }
          if (block.type === "tool_result") {
            return (
              <div
                key={i}
                className={`mt-2 text-xs rounded-md p-3 font-mono overflow-x-auto ${
                  block.isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <pre className="whitespace-pre-wrap break-all">
                  {block.content.length > 2000
                    ? block.content.slice(0, 2000) + "\n... (truncated)"
                    : block.content}
                </pre>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
