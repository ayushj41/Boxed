// filepath: /D:/Box_2/Boxed/client/src/middleware.ts
import { useAuth } from "@clerk/clerk-react";

export default useAuth({
  publicRoutes: ['/'],
  ignoredRoutes: ['/api/webhooks'],
});