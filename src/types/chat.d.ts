export type Role = "user" | "assistant" | "system";

// export interface Message {
//   id: string;
//   role: Role;
//   text: string;
//   timestamp: string;
// }

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  isTemp?: boolean;
  error?: boolean;
};

