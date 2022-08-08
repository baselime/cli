export function isUrl(s: string): boolean {
  try {
    const url = new URL(s);
    const res = url.protocol === "https:" || url.protocol === "http:";
    return res;
  } catch (_) {
    return false;
  }
};

export function parseTemplateName(s: string): { workspaceId: string; template: string } {
  const workspaceRegex = /[@\/]+/i;

  return {
    workspaceId: s.split(workspaceRegex)[1],
    template: s.split(workspaceRegex)[2]
  }
}
