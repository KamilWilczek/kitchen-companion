// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { getOrCreateUserId } from '../app/utils/userId'

// const Ctx = createContext<string | null>(null);

// export function UserIdProvider({ children }: { children: React.ReactNode }) {
//   const [userId, setUserId] = useState<string | null>(null);

//   useEffect(() => {
//     let mounted = true;
//     getOrCreateUserId().then(id => { if (mounted) setUserId(id); });
//     return () => { mounted = false; };
//   }, []);

//   if (!userId) return null;
//   return <Ctx.Provider value={userId}>{children}</Ctx.Provider>;
// }

// export function useUserId() {
//   const v = useContext(Ctx);
//   if (!v) throw new Error("UserIdProvider missing");
//   return v;
// }