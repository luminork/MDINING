// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import HomeScreen from "../../components/HomeScreen";
// import { Login } from "../../components/Login";
// import { AboutMe } from "../../components/AboutMe";

// const Stack = createNativeStackNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="Login" component={Login} />
//         <Stack.Screen name="AboutMe" component={AboutMe} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }



import HomeScreen from "@/components/HomeScreen";

export default function Home() {
  return <HomeScreen />;
}