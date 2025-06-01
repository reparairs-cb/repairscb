export interface NoiseType {
  type: "loading" | "error" | "success";
  message?: string;
  styleType?: "page" | "modal";
}