// convex/adrs.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("adrs").collect();
  },
});

export const getById = query({
  args: { id: v.id("adrs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    status: v.string(),
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
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("adrs", {
      ...args,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: crypto.randomUUID(),
          from: "",
          to: args.status,
          date: now,
          reason: "Initial creation",
        },
      ],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("adrs"),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
    problem: v.optional(v.string()),
    context: v.optional(v.string()),
    options: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          description: v.string(),
          pros: v.array(v.string()),
          cons: v.array(v.string()),
        })
      )
    ),
    decision: v.optional(v.string()),
    outcome: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    relatedADRs: v.optional(v.array(v.string())),
    codeReferences: v.optional(
      v.array(
        v.object({
          id: v.string(),
          path: v.string(),
          snippet: v.optional(v.string()),
          description: v.string(),
        })
      )
    ),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    
    const existingADR = await ctx.db.get(id);
    if (!existingADR) {
      throw new Error("ADR not found");
    }
    
    // Create a patch object with our updates
    const patch: Record<string, unknown> = {
      ...updates,
      updatedAt: now,
    };
    
    // Handle status changes
    if (updates.status && updates.status !== existingADR.status) {
      const statusChange = {
        id: crypto.randomUUID(),
        from: existingADR.status,
        to: updates.status,
        date: now,
        reason: "Status updated", // Ideally this would be provided by the user
      };
      
      // Add to the existing status history
      patch.statusHistory = [
        ...(existingADR.statusHistory || []),
        statusChange,
      ];
    }
    
    return await ctx.db.patch(id, patch);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("adrs"),
    newStatus: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, newStatus, reason } = args;
    const now = new Date().toISOString();
    
    const existingADR = await ctx.db.get(id);
    if (!existingADR) {
      throw new Error("ADR not found");
    }
    
    const statusChange = {
      id: crypto.randomUUID(),
      from: existingADR.status,
      to: newStatus,
      date: now,
      reason,
    };
    
    // Make sure statusHistory exists
    const statusHistory = existingADR.statusHistory || [];
    
    return await ctx.db.patch(id, {
      status: newStatus,
      statusHistory: [...statusHistory, statusChange],
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("adrs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});