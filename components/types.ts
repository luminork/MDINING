// types.ts
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface MenuItem {
  item_name: string;
  traits: string[];
  allergens: string[];
  nutrition: {
    calories?: string;
    calcium?: string;
    cholesterol?: string;
    dietary_fiber?: string;
    iron?: string;
    protein?: string;
    saturated_fat?: string;
    serving_size?: string;
    sodium?: string;
    sugars?: string;
    total_carbohydrate?: string;
    total_fat?: string;
    trans_fat?: string;
    vitamin_a?: string;
    vitamin_c?: string;
  };
  rating?: string; // Add this for hardcoded ratings
}

export interface MenuSection {
  station_name: string;
  items: MenuItem[];
}

export interface Recommendation {
  reasoning: string;
}

export interface DiningHall {
  dining_hall: string;
  distance: number;
  last_updated: string;
  status: string;
  menus: {
    Breakfast: MenuSection[];
    Brunch: MenuSection[];
    Lunch: MenuSection[];
    Dinner: MenuSection[];
  };
}

export interface DiningHallResponse {
  recommendation: Recommendation;
  dining_info: DiningHall[];
  payload: string;
}

export interface ChatMessage {
  user_id: string;
  prompt: string;
  response: string;
}
