// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Export the schema definition
export default defineSchema({
  adrs: defineTable({
    title: v.string(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    problem: v.string(),
    context: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        pros: v.array(v.string()),
        cons: v.array(v.string()),
      })
    ),
    decision: v.string(),
    outcome: v.string(),
    tags: v.array(v.string()),
    relatedADRs: v.array(v.string()),
    codeReferences: v.array(
      v.object({
        id: v.string(),
        path: v.string(),
        snippet: v.optional(v.string()),
        description: v.string(),
      })
    ),
    statusHistory: v.array(
      v.object({
        id: v.string(),
        from: v.string(),
        to: v.string(),
        date: v.string(),
        reason: v.string(),
      })
    ),
    projectId: v.optional(v.string()),
  }),
  
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    repositoryUrl: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),
  
  architectureNotes: defineTable({
    title: v.string(),
    content: v.string(),
    createdAt: v.string(),
    tags: v.array(v.string()),
    codeReferences: v.array(
      v.object({
        id: v.string(),
        path: v.string(),
        snippet: v.optional(v.string()),
        description: v.string(),
      })
    ),
    adrId: v.optional(v.string()),
  }),
});