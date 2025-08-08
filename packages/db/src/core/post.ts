export type Tag = {
  id: string;
  name: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  /** R2上のMarkdownファイル名（拡張子除去後）。R2連携由来ポストでのみ利用 */
  r2FileName?: string | null;
  tags: Tag[];
};
