import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import LinearGradient from "react-native-linear-gradient";


type NutritionInfo = {
  serving_size: string;
  calories: string;
  total_fat: string;
  saturated_fat: string;
  trans_fat: string;
  cholesterol: string;
  sodium: string;
  total_carbohydrate: string;
  dietary_fiber: string;
  sugars: string;
  protein: string;
  vitamin_a: string;
  vitamin_c: string;
  calcium: string;
  iron: string;
};

type FoodItem = {
  item_name: string;
  traits: string[];
  allergens: string[];
  nutrition: NutritionInfo;
};

type Station = {
  [station: string]: FoodItem[];
};

type Menu = {
  [meal: string]: Station;
};

type DiningHall = {
  dining_hall: string;
  menus: Menu;
};

export const Menu: React.FC = () => {
  const [data, setData] = useState<DiningHall[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_full_menu/");
        if (response.ok) {
          const data: DiningHall[] = await response.json();
          setData(data);
        } else {
          Alert.alert("Error", "Unable to fetch menu.");
        }
      } catch (error) {
        Alert.alert("Error", "Server error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00274C" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.noMenuContainer}>
        <Text style={styles.noMenuText}>No menu available for today.</Text>
      </View>
    );
  }

  const renderFoodItem = (food: FoodItem) => (
    <View key={food.item_name} style={styles.foodSquare}>
      <Text style={styles.foodName}>{food.item_name}</Text>
      {renderTraits(food.traits)}
      <Text style={styles.foodDetails}>
        {food.allergens.length > 0 ? `Allergens: ${food.allergens.join(", ")}` : "No Allergens"}
      </Text>
      <Text style={styles.foodDetails}>Calories: {food.nutrition.calories}</Text>
    </View>
  );

  const renderTraits = (traits: string[]) => (
    <View style={styles.traitBubbleContainer}>
      {traits.map((trait, index) => (
        <View key={index} style={[styles.traitBubble, { backgroundColor: getTraitColor(trait) }]}>
          <Text style={styles.traitBubbleText}>{trait}</Text>
        </View>
      ))}
    </View>
  );
  

  const renderStation = (stationName: string, foods: FoodItem[]) => (
    <View key={stationName} style={styles.stationContainer}>
      <Text style={styles.stationTitle}>{stationName}</Text>
      <View style={styles.stationBox}>
        <View style={styles.foodGrid}>
          {foods.map((food) => renderFoodItem(food))}
        </View>
      </View>
    </View>
  );
  

  const getTraitColor = (trait: string) => {
    if (trait.toLowerCase().includes("vegan")) return "#4CAF50"; // Green for Vegan
    if (trait.toLowerCase().includes("vegetarian")) return "#81C784"; // Light green for Vegetarian
  
    if (trait.toLowerCase().includes("nutrient dense low")) return "#FFF59D"; // Light yellow
    if (trait.toLowerCase().includes("nutrient dense medium")) return "#FFC107"; // Orange
    if (trait.toLowerCase().includes("nutrient dense high")) return "#FF9800"; // Dark orange
  
    if (trait.toLowerCase().includes("spicy")) return "#F44336"; // Red for Spicy
  
    if (trait.toLowerCase().includes("carbon footprint low")) return "#D1C4E9"; // Light purple
    if (trait.toLowerCase().includes("carbon footprint medium")) return "#9575CD"; // Medium purple
    if (trait.toLowerCase().includes("carbon footprint high")) return "#673AB7"; // Darker purple
    if (trait.toLowerCase().includes("gluten free")) return "#FFC0CB";
    if (trait.toLowerCase().includes("halal")) return "#89CFF0";
    if (trait.toLowerCase().includes("kosher")) return "#C4A484";

    return "#D3D3D3"; // Default color for other traits GRAY
  };
  

  const renderMeal = (mealName: string, stations: Station) => (
    <View key={mealName} style={styles.mealContainer}>
      <Text style={styles.mealTitle}>{mealName}</Text>
      {Object.entries(stations).map(([stationName, foods]) =>
        renderStation(stationName, foods)
      )}
    </View>
  );

  const renderDiningHall = (hall: DiningHall) => (
    <View key={hall.dining_hall} style={styles.hallContainer}>
      <Text style={styles.hallTitle}>{hall.dining_hall}</Text>
      {Object.entries(hall.menus).map(([mealName, stations]) =>
        renderMeal(mealName, stations)
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/dining.webp")}
            style={styles.headerLogo}
          />
        </View>

        <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.push("/home")} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/login")} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/about")} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>About Me</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/menu")} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Menu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.pageHeader}>Menu</Text>
      {data.map((hall) => renderDiningHall(hall))}
    </ScrollView>
  );
};

const UMICH_COLORS = {
  maize: "#FFCB05",
  blue: "#00274C",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C4E80",
    padding: 16,
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
  
  stationBox: {
    backgroundColor: "#F0F0F0", // Light gray background
    padding: 12, // Padding inside the box
    borderRadius: 8, // Rounded corners
    marginBottom: 12, // Space below the box
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
  pageHeader: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 10,
    color: "#FFFFFF",
  },
  hallContainer: {
    marginBottom: 16,
  },
  hallTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: UMICH_COLORS.maize,
    marginBottom: 8,
  },
  mealContainer: {
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: UMICH_COLORS.maize,
    marginBottom: 8,
  },
  stationContainer: {
    marginBottom: 12,
  },
  titleBubbleText: {
    color: UMICH_COLORS.maize, // Blue text for contrast
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  stationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  foodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  foodSquare: {
    backgroundColor: "#FFFFFF",
    width: "22%",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
    "marginHorizontal": 8,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "bold",
    color: UMICH_COLORS.blue,
    marginBottom: 4,
    textAlign: "center",
  },
  foodDetails: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: UMICH_COLORS.blue,
  },
  noMenuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noMenuText: {
    fontSize: 18,
    color: UMICH_COLORS.blue,
  },
  traitBubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 4,
  },
  traitBubble: {
    backgroundColor: UMICH_COLORS.blue, // Use your desired bubble color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6, // Space between rows of bubbles
  },
  traitBubbleText: {
    color: UMICH_COLORS.blue, // Text color for contrast
    fontSize: 12,
    fontWeight: "600",
  },
});