import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "MEMBER";
      jobTitle: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    jobTitle: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MEMBER";
    jobTitle: string;
  }
}
