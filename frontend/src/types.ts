export type Article = {
  id: number;
  title: string;
  description: string;
  body: string;
  author: string;
};

export type ApiState = "idle" | "loading" | "error" | "success";

