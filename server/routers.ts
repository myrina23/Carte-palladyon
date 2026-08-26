import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { nanoid } from "nanoid";
import { addSnapshotCollectionItem, createRelationProposal, createSnapshotCollection, deleteSnapshotCollection, getSharedSnapshotCollection, listPendingRelationProposals, listRelationProposalsBySubmitter, listSnapshotCollectionsByOwner, reviewRelationProposal } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const relationProposalInput = z.object({
  sourceActor: z.string().trim().min(2).max(120),
  targetActor: z.string().trim().min(2).max(120),
  relationType: z.string().trim().min(3).max(64),
  title: z.string().trim().min(4).max(255),
  detail: z.string().trim().min(20).max(5000),
  sourceUrl: z.string().url().max(1000),
  startYear: z.number().int().min(1800).max(2100).optional(),
  endYear: z.number().int().min(1800).max(2100).optional(),
}).refine((proposal) => proposal.endYear === undefined || proposal.startYear === undefined || proposal.endYear >= proposal.startYear, { message: "La fin doit être postérieure au début.", path: ["endYear"] });

export const snapshotCollectionInput = z.object({
  name: z.string().trim().min(2).max(160),
  visibility: z.enum(["private", "shared"]).default("private"),
  items: z.array(z.object({ label: z.string().trim().min(1).max(160), snapshotJson: z.string().min(2).max(50_000) })).min(1).max(24),
});

export const snapshotCollectionRemoveInput = z.object({ id: z.number().int().positive() });
export const sharedSnapshotCollectionInput = z.object({ shareKey: z.string().min(6).max(64) });

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  relationProposals: router({
    mine: protectedProcedure.query(({ ctx }) => listRelationProposalsBySubmitter(ctx.user.id)),
    submit: protectedProcedure.input(relationProposalInput).mutation(async ({ ctx, input }) => {
      await createRelationProposal({ ...input, submitterId: ctx.user.id });
      return { success: true } as const;
    }),
    pending: adminProcedure.query(() => listPendingRelationProposals()),
    review: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      await reviewRelationProposal(input.id, ctx.user.id, input.status, input.reviewNote);
      return { success: true } as const;
    }),
  }),
  snapshotCollections: router({
    mine: protectedProcedure.query(({ ctx }) => listSnapshotCollectionsByOwner(ctx.user.id)),
    create: protectedProcedure.input(snapshotCollectionInput).mutation(async ({ ctx, input }) => {
      const shareKey = nanoid(14);
      const id = await createSnapshotCollection({ ownerId: ctx.user.id, name: input.name, visibility: input.visibility, shareKey });
      await Promise.all(input.items.map((item) => addSnapshotCollectionItem({ collectionId: id, ...item })));
      return { id, shareKey };
    }),
    remove: protectedProcedure.input(snapshotCollectionRemoveInput).mutation(async ({ ctx, input }) => {
      await deleteSnapshotCollection(ctx.user.id, input.id);
      return { success: true } as const;
    }),
    shared: publicProcedure.input(sharedSnapshotCollectionInput).query(({ input }) => getSharedSnapshotCollection(input.shareKey)),
  }),
});

export type AppRouter = typeof appRouter;
