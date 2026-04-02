export interface Comment {
  id: string;
  post_id: number;
  author: string;
  content: string;
  password_hash: string;
  created_at: string;
}

export interface CommentInsert {
  post_id: number;
  author: string;
  content: string;
  password_hash: string;
}

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: Comment;
        Insert: CommentInsert;
        Update: Partial<CommentInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
