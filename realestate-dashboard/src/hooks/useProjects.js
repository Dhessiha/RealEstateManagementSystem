import { useMemo, useState } from "react";
import { useEntityStore } from "./useEntityStore";
import { useAuth } from "./useAuth";

export function isProjectForClient(project, user) {
  if (!user || user.role !== "client") return true;
  const userEmail = (user.email || "").trim().toLowerCase();
  const userName = (user.name || "").trim().toLowerCase();
  const userId = user.id;

  if (project.clientId && project.clientId === userId) return true;
  if (project.clientEmail && userEmail && project.clientEmail.toLowerCase() === userEmail) return true;
  if (project.client) {
    const pc = project.client.trim().toLowerCase();
    if (userEmail && pc === userEmail) return true;
    if (userName && pc === userName) return true;
  }
  return false;
}

export function useProjects() {
  const { records: rawProjects, add, update, remove } = useEntityStore("siteflow.projects", "PRJ");
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const visibleProjects = useMemo(() => {
    if (user?.role === "client") {
      return rawProjects.filter((p) => isProjectForClient(p, user));
    }
    return rawProjects;
  }, [rawProjects, user]);

  const filtered = useMemo(() => {
    return visibleProjects.filter((p) => {
      const matchesQuery =
        query.trim().length === 0 ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [visibleProjects, query, typeFilter, statusFilter]);

  return {
    projects: filtered,
    allProjects: visibleProjects,
    rawProjects,
    addProject: add,
    updateProject: update,
    removeProject: remove,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
  };
}

export function useProject(projectId) {
  const { allProjects } = useProjects();
  return useMemo(() => allProjects.find((p) => p.id === projectId) ?? null, [allProjects, projectId]);
}

