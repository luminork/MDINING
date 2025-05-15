import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";

const UMICH_COLORS = {
  maize: "#FFCB05",
  blue: "#00274C",
  white: "#FFFFFF",
  lightMaize: "#FFE068",
  lightBlue: "#1C4E80",
};

export const AboutMe = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("traits");

  const [preferences, setPreferences] = useState({
    traits: {
      vegan: "neutral",
      vegetarian: "neutral",
      spicy: "neutral",
      kosher: "neutral",
      halal: "neutral",
      glutenFree: "neutral",
      nutrientLow: "neutral",
    },
    allergens: {
      milk: false,
      eggs: false,
      fish: false,
      shellfish: false,
      treeNuts: false,
      peanuts: false,
      wheat: false,
      soy: false,
    },
    custom_preferences: "",
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/fetch_preferences/");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        } else {
          Alert.alert("Error", "Unable to fetch preferences");
        }
      } catch (error) {
        Alert.alert("Error", "Server error. Please try again later.");
      }
    };

    fetchPreferences();
  }, []);

  const savePreferences = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/save_preferences/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        Alert.alert("Success", "Preferences saved successfully!");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to save preferences.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error. Please try again later.");
    }
  };

  const endSession = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/end_session/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        Alert.alert("Success", "Logged out successfully.");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to log out.");
      }
    } catch (error) {
      Alert.alert("Error", "Server error. Please try again later.");
    }
  };

  const renderTraitsTab = () => (
    <View style={styles.preferencesContainer}>
      {Object.entries(preferences.traits).map(([trait, value], index) => (
        <View key={index} style={styles.preferenceItem}>
          <Text style={styles.label}>
            {trait.charAt(0).toUpperCase() + trait.slice(1).replace(/_/g, " ")}:
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={value}
              onValueChange={(newValue) =>
                setPreferences((prev) => ({
                  ...prev,
                  traits: { ...prev.traits, [trait]: newValue },
                }))
              }
              style={styles.picker}
              dropdownIconColor={UMICH_COLORS.blue}
            >
              <Picker.Item
                label="Like"
                value="like"
                color={UMICH_COLORS.blue}
              />
              <Picker.Item
                label="Neutral"
                value="neutral"
                color={UMICH_COLORS.blue}
              />
              <Picker.Item
                label="Dislike"
                value="dislike"
                color={UMICH_COLORS.blue}
              />
            </Picker>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAllergensTab = () => (
    <View style={styles.preferencesContainer}>
      {Object.entries(preferences.allergens).map(([allergen, value], index) => (
        <TouchableOpacity
          key={index}
          style={[styles.allergenItem, value && styles.allergenSelected]}
          onPress={() =>
            setPreferences((prev) => ({
              ...prev,
              allergens: { ...prev.allergens, [allergen]: !value },
            }))
          }
        >
          <Text
            style={[styles.allergenText, value && styles.allergenTextSelected]}
          >
            {allergen.charAt(0).toUpperCase() +
              allergen.slice(1).replace(/_/g, " ")}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCustomTab = () => (
    <View style={styles.preferencesContainer}>
      <Text style={styles.label}>Custom Preferences:</Text>
      <TextInput
        style={styles.textBox}
        multiline
        value={preferences.custom_preferences}
        onChangeText={(text) =>
          setPreferences((prev) => ({ ...prev, custom_preferences: text }))
        }
        placeholder="Enter your custom preferences..."
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {/* Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/dining.webp")}
            style={styles.headerLogo}
          />
        </View>

        <View style={styles.headerNav}>
          <TouchableOpacity
            onPress={() => router.push("/home")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/about")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>About Me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/menu")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Menu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.title}>About Me</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "traits" && styles.activeTab]}
            onPress={() => setActiveTab("traits")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "traits" && styles.activeTabText,
              ]}
            >
              Traits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "allergens" && styles.activeTab]}
            onPress={() => setActiveTab("allergens")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "allergens" && styles.activeTabText,
              ]}
            >
              Allergens
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "custom" && styles.activeTab]}
            onPress={() => setActiveTab("custom")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "custom" && styles.activeTabText,
              ]}
            >
              Learned
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "traits" && renderTraitsTab()}
        {activeTab === "allergens" && renderAllergensTab()}
        {activeTab === "custom" && renderCustomTab()}

        <TouchableOpacity style={styles.saveButton} onPress={savePreferences}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logOutButton}
          onPress={async () => {
            await endSession();
            router.push("/login");
          }}
        >
          <Text style={styles.logOutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: UMICH_COLORS.lightBlue,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: UMICH_COLORS.white,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: UMICH_COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: UMICH_COLORS.blue,
  },
  tabText: {
    color: UMICH_COLORS.blue,
    fontWeight: "600",
  },
  activeTabText: {
    color: UMICH_COLORS.white,
  },
  preferencesContainer: {
    backgroundColor: UMICH_COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: UMICH_COLORS.maize,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  preferenceItem: {
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: UMICH_COLORS.maize,
    paddingLeft: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    color: UMICH_COLORS.blue,
    fontWeight: "600",
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: UMICH_COLORS.blue,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: UMICH_COLORS.white,
  },
  picker: {
    height: 50,
    color: UMICH_COLORS.blue,
  },
  allergenItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: UMICH_COLORS.blue,
  },
  allergenSelected: {
    backgroundColor: UMICH_COLORS.blue,
  },
  allergenText: {
    color: UMICH_COLORS.blue,
    fontSize: 16,
    fontWeight: "600",
  },
  allergenTextSelected: {
    color: UMICH_COLORS.white,
  },
  learnedPreferenceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  learnedPreferenceLabel: {
    fontSize: 16,
    color: UMICH_COLORS.blue,
    fontWeight: "600",
    marginBottom: 4,
  },
  learnedPreferenceValue: {
    fontSize: 14,
    color: "#666",
  },
  learnedPreferenceHint: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 16,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: UMICH_COLORS.blue,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: UMICH_COLORS.maize,
  },
  saveButtonText: {
    color: UMICH_COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
  logOutButton: {
    backgroundColor: UMICH_COLORS.maize,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: UMICH_COLORS.blue,
  },
  logOutButtonText: {
    color: UMICH_COLORS.blue,
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  backButtonText: {
    color: UMICH_COLORS.maize,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 90,
    height: 70,
    backgroundColor: "#fff",
  },
  headerNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  headerButton: {
    backgroundColor: UMICH_COLORS.maize,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  headerButtonText: {
    fontSize: 15,
    color: UMICH_COLORS.blue,
    fontWeight: "600",
    textAlign: "center",
  },
  textBox: {
    borderWidth: 1,
    borderColor: UMICH_COLORS.blue,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: UMICH_COLORS.white,
    color: UMICH_COLORS.blue,
  },

});