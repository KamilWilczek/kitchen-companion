const DEV_USER_ID = "dev-user"; 

export function authHeaders(userId: string) {
  return {
    "Content-Type": "application/json",
    "X-User-Id": DEV_USER_ID,
  };
}