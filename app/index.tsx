import { Redirect } from "expo-router";

export default function Index() {
  // Always redirect to login - let the login screen check for existing token
  return <Redirect href="/(auth)/login" />;
}
