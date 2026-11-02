export const importKeys = {
  all: (companyId: string) => ["imports", companyId] as const,
  schemas: (companyId: string) => [...importKeys.all(companyId), "schemas"] as const,
  jobs: (companyId: string, page: number) =>
    [...importKeys.all(companyId), "jobs", page] as const,
  job: (companyId: string, jobId: string) =>
    [...importKeys.all(companyId), "job", jobId] as const,
  errors: (companyId: string, jobId: string, page: number) =>
    [...importKeys.all(companyId), "job", jobId, "errors", page] as const,
};
