// components/SignUp.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

const UMICH_COLORS = {
  maize: "#FFCB05",
  blue: "#00274C",
  white: "#FFFFFF",
  lightMaize: "#FFE068",
  lightBlue: "#1C4E80",
};

export const SignUp = () => {
  const router = useRouter();
  const [uniqname, setUniqname] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={require("../assets/logo1.png")} style={styles.logo} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>
            Please enter your uniqname and desired password
          </Text>

          <TextInput
            placeholder="Uniqname"
            value={uniqname}
            onChangeText={setUniqname}
            style={styles.input}
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={styles.SignUpButton}
            onPress={async () => {
              try {
                const response = await fetch("http://localhost:5000/signup/", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "uniqname": uniqname,
                    "password": password,
                  },
                });

                if (response.ok) {
                  console.log("Sign Up successful");
                  router.navigate("/");
                } else {
                  console.error("Sign Up failed");
                  router.push("/signup");
                }
              } catch (error) {
                console.error("Error:", error);
              }
            }}
          >
            <Text style={styles.SignUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.signupLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  formContainer: {
    backgroundColor: UMICH_COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: UMICH_COLORS.maize,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: UMICH_COLORS.blue,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    backgroundColor: UMICH_COLORS.white,
    borderWidth: 2,
    borderColor: UMICH_COLORS.blue,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: UMICH_COLORS.blue,
  },
  SignUpButton: {
    backgroundColor: UMICH_COLORS.blue,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: UMICH_COLORS.maize,
  },
  SignUpButtonText: {
    color: UMICH_COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    color: "#666",
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#666",
    fontSize: 16,
  },
  signupLink: {
    color: UMICH_COLORS.blue,
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 30,
    alignItems: "center",
  },
  backButtonText: {
    color: UMICH_COLORS.maize,
    fontSize: 16,
    fontWeight: "600",
  },
});
