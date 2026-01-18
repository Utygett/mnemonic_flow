export type UserGroupResponse = {
  user_group_id: string;
  kind: string;
  source_group_id: string | null;
  title: string;
  description: string | null;
  parent_id: string | null;
};

export type GroupCreatePayload = {
  title: string;
  description?: string | null;
  parent_id?: string | null;
};

export type Group = {
  id: string; // user_group_id
  title: string;
  description: string | null;
  parent_id: string | null;
  kind: string;
  source_group_id: string | null;
};
