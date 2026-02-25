import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../lib/base44";
import type { Database, EntityName } from "../types/entities";

type EntityItem<K extends EntityName> = Database[K][number];

export function useEntityList<K extends EntityName>(entity: K) {
  return useQuery<EntityItem<K>[]>({
    queryKey: [entity],
    queryFn: () => base44.entities[entity].list() as Promise<EntityItem<K>[]>
  });
}

export function useEntityCreate<K extends EntityName>(entity: K) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<EntityItem<K>, "id" | "createdAt" | "updatedAt">) =>
      base44.entities[entity].create(payload as never) as Promise<EntityItem<K>>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [entity] });
    }
  });
}

export function useEntityUpdate<K extends EntityName>(entity: K) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EntityItem<K>> }) =>
      base44.entities[entity].update(id, patch as never) as Promise<EntityItem<K>>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [entity] });
    }
  });
}

export function useEntityDelete<K extends EntityName>(entity: K) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => base44.entities[entity].delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [entity] });
    }
  });
}
