import { describe, expect, it } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const collectionDb = vi.hoisted(() => ({
  addItem: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  shared: vi.fn(),
}));

vi.mock("./db", () => ({
  addSnapshotCollectionItem: collectionDb.addItem,
  createRelationProposal: vi.fn(),
  createSnapshotCollection: collectionDb.create,
  deleteSnapshotCollection: collectionDb.remove,
  getSharedSnapshotCollection: collectionDb.shared,
  listPendingRelationProposals: vi.fn(),
  listRelationProposalsBySubmitter: vi.fn(),
  listSnapshotCollectionsByOwner: vi.fn(),
  reviewRelationProposal: vi.fn(),
}));

import {
  appRouter,
  sharedSnapshotCollectionInput,
  snapshotCollectionInput,
  snapshotCollectionRemoveInput,
} from "./routers";

describe("snapshotCollectionInput", () => {
  it("accepte une collection partagée avec un relevé sérialisé", () => {
    const result = snapshotCollectionInput.safeParse({
      name: "Veille indo-pacifique",
      visibility: "shared",
      items: [{ label: "Relations 2024", snapshotJson: JSON.stringify({ timelineYear: 2024, regions: ["asia"] }) }],
    });
    expect(result.success).toBe(true);
  });

  it("refuse une collection sans relevé", () => {
    expect(snapshotCollectionInput.safeParse({ name: "Vide", items: [] }).success).toBe(false);
  });

  it("refuse un relevé sans contenu", () => {
    expect(snapshotCollectionInput.safeParse({ name: "Test", items: [{ label: "Carte", snapshotJson: "" }] }).success).toBe(false);
  });

  it("valide les identifiants de suppression et de partage", () => {
    expect(snapshotCollectionRemoveInput.safeParse({ id: 8 }).success).toBe(true);
    expect(snapshotCollectionRemoveInput.safeParse({ id: 0 }).success).toBe(false);
    expect(sharedSnapshotCollectionInput.safeParse({ shareKey: "atlas-collect-01" }).success).toBe(true);
    expect(sharedSnapshotCollectionInput.safeParse({ shareKey: "court" }).success).toBe(false);
  });
});

describe("procédures de collections", () => {
  const caller = () => appRouter.createCaller({ user: { id: 42 }, req: {} as never, res: {} as never } as never);

  beforeEach(() => {
    vi.clearAllMocks();
    collectionDb.create.mockResolvedValue(18);
    collectionDb.shared.mockResolvedValue({ id: 18, name: "Veille indo-pacifique", items: [] });
  });

  it("crée, partage, consulte puis supprime une collection du propriétaire", async () => {
    const api = caller();
    const created = await api.snapshotCollections.create({
      name: "Veille indo-pacifique",
      visibility: "shared",
      items: [{ label: "Relations 2024", snapshotJson: JSON.stringify({ timelineYear: 2024, regions: ["asia"] }) }],
    });

    expect(created.id).toBe(18);
    expect(created.shareKey).toHaveLength(14);
    expect(collectionDb.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 42, visibility: "shared" }));
    expect(collectionDb.addItem).toHaveBeenCalledWith(expect.objectContaining({ collectionId: 18, label: "Relations 2024" }));

    await api.snapshotCollections.shared({ shareKey: created.shareKey });
    expect(collectionDb.shared).toHaveBeenCalledWith(created.shareKey);

    await expect(api.snapshotCollections.remove({ id: 18 })).resolves.toEqual({ success: true });
    expect(collectionDb.remove).toHaveBeenCalledWith(42, 18);
  });
});
