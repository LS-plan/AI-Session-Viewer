import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../stores/appStore";
import { FolderOpen, Clock, Hash, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export function ProjectsPage() {
  const navigate = useNavigate();
  const {
    source,
    projects,
    loadProjects,
    projectsLoading,
    crossProjectTags,
    globalTagFilter,
    loadCrossProjectTags,
    setGlobalTagFilter,
  } = useAppStore();

  useEffect(() => {
    loadProjects();
    loadCrossProjectTags();
  }, [source]);

  // Deduplicated sorted list of all tags across projects
  const allGlobalTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tags of Object.values(crossProjectTags)) {
      for (const tag of tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [crossProjectTags]);

  const toggleGlobalTag = (tag: string) => {
    if (globalTagFilter.includes(tag)) {
      setGlobalTagFilter(globalTagFilter.filter((t) => t !== tag));
    } else {
      setGlobalTagFilter([...globalTagFilter, tag]);
    }
  };

  // Filter projects by global tag filter
  const filteredProjects =
    globalTagFilter.length > 0
      ? projects.filter((p) => {
          const projectTags = crossProjectTags[p.id] || [];
          return globalTagFilter.every((t) => projectTags.includes(t));
        })
      : projects;

  const emptyText =
    source === "claude"
      ? "未找到任何 Claude 项目。请确认 ~/.claude/projects/ 目录存在。"
      : "未找到任何 Codex 项目。请确认 ~/.codex/sessions/ 目录存在。";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">所有项目</h1>

      {/* Global tag filter bar */}
      {allGlobalTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {allGlobalTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleGlobalTag(tag)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                globalTagFilter.includes(tag)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {tag}
            </button>
          ))}
          {globalTagFilter.length > 0 && (
            <button
              onClick={() => setGlobalTagFilter([])}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {projectsLoading ? (
        <div className="text-muted-foreground">加载项目列表...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-muted-foreground">
          {globalTagFilter.length > 0
            ? "没有匹配筛选条件的项目。"
            : emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() =>
                navigate(
                  `/projects/${encodeURIComponent(project.id)}`
                )
              }
              className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/50 hover:bg-accent/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <FolderOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">
                    {project.shortName}
                  </h3>
                  <p
                    className="text-xs text-muted-foreground truncate mt-1"
                    title={project.displayPath}
                  >
                    {project.displayPath}
                  </p>
                  {/* Project tags */}
                  {crossProjectTags[project.id] && crossProjectTags[project.id].length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {crossProjectTags[project.id].map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/15 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {project.sessionCount} 个会话
                    </span>
                    {project.lastModified && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(
                          new Date(project.lastModified),
                          { addSuffix: true, locale: zhCN }
                        )}
                      </span>
                    )}
                  </div>
                  {project.modelProvider && (
                    <span className="mt-2 inline-block text-xs px-2 py-0.5 bg-muted rounded">
                      {project.modelProvider}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
