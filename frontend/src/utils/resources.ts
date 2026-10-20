import type { McpResource, ModelResource, RagResource, ResourceKind } from '../stores/resourceStore';

export type Resource = ModelResource | RagResource | McpResource;

export function isModelResource(kind: ResourceKind, resource: Resource): resource is ModelResource {
  return kind === 'models' && 'provider' in resource;
}

export function getResourceDescription(kind: ResourceKind, resource: Resource) {
  if (resource.description) return resource.description;
  if (isModelResource(kind, resource)) return `${resource.provider} · ${resource.model_name}`;
  return resource.type;
}

export function getResourceDetailsPath(kind: ResourceKind, id: number) {
  return `/resources/${kind}/${id}`;
}
