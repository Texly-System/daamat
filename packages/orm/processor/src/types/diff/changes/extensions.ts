export interface CreateExtensionChange {
  type: "create_extension";
  extension: string;
  priority: number;
}
