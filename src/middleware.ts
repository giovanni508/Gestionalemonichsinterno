import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/progetti/:path*",
    "/team/:path*",
    "/chat/:path*",
    "/guida/:path*",
    "/profilo/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
    "/api/users/:path*",
    "/api/chat/:path*",
    "/api/ai/:path*",
  ],
};
