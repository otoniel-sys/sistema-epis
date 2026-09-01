// @ts-expect-error - Prisma config typings might not be resolved correctly by Next.js
import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});
