/**
 * Maps food names to representative emojis.
 * Uses keyword matching against the food name and brand.
 */

const EMOJI_MAP: Array<{ keywords: string[]; emoji: string }> = [
  // Fruits
  { keywords: ['apple'], emoji: '🍎' },
  { keywords: ['banana'], emoji: '🍌' },
  { keywords: ['orange', 'mandarin', 'tangerine', 'clementine'], emoji: '🍊' },
  { keywords: ['grape'], emoji: '🍇' },
  { keywords: ['strawberry', 'strawberries'], emoji: '🍓' },
  { keywords: ['blueberry', 'blueberries'], emoji: '🫐' },
  { keywords: ['watermelon'], emoji: '🍉' },
  { keywords: ['peach', 'nectarine'], emoji: '🍑' },
  { keywords: ['pineapple'], emoji: '🍍' },
  { keywords: ['mango'], emoji: '🥭' },
  { keywords: ['cherry', 'cherries'], emoji: '🍒' },
  { keywords: ['lemon'], emoji: '🍋' },
  { keywords: ['avocado'], emoji: '🥑' },
  { keywords: ['coconut'], emoji: '🥥' },
  { keywords: ['kiwi'], emoji: '🥝' },
  { keywords: ['pear'], emoji: '🍐' },

  // Vegetables
  { keywords: ['broccoli'], emoji: '🥦' },
  { keywords: ['carrot'], emoji: '🥕' },
  { keywords: ['corn'], emoji: '🌽' },
  { keywords: ['tomato', 'tomatoes'], emoji: '🍅' },
  { keywords: ['potato', 'potatoes', 'fries', 'chips'], emoji: '🍟' },
  { keywords: ['salad', 'lettuce', 'greens'], emoji: '🥗' },
  { keywords: ['mushroom'], emoji: '🍄' },
  { keywords: ['onion'], emoji: '🧅' },
  { keywords: ['garlic'], emoji: '🧄' },
  { keywords: ['pepper', 'capsicum', 'chili', 'chilli'], emoji: '🌶️' },
  { keywords: ['cucumber'], emoji: '🥒' },
  { keywords: ['eggplant', 'aubergine'], emoji: '🍆' },
  { keywords: ['sweet potato'], emoji: '🍠' },

  // Proteins
  { keywords: ['chicken'], emoji: '🍗' },
  { keywords: ['steak', 'beef', 'sirloin', 'ribeye'], emoji: '🥩' },
  { keywords: ['pork', 'bacon', 'ham'], emoji: '🥓' },
  { keywords: ['fish', 'salmon', 'tuna', 'cod', 'barramundi', 'snapper'], emoji: '🐟' },
  { keywords: ['shrimp', 'prawn', 'prawns'], emoji: '🦐' },
  { keywords: ['egg', 'eggs', 'omelette', 'omelet'], emoji: '🥚' },
  { keywords: ['turkey'], emoji: '🦃' },
  { keywords: ['lamb'], emoji: '🍖' },
  { keywords: ['sausage', 'hot dog', 'hotdog', 'frankfurter'], emoji: '🌭' },

  // Grains & Carbs
  { keywords: ['rice'], emoji: '🍚' },
  { keywords: ['bread', 'toast', 'sourdough'], emoji: '🍞' },
  { keywords: ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'macaroni'], emoji: '🍝' },
  { keywords: ['noodle', 'ramen', 'udon', 'pho'], emoji: '🍜' },
  { keywords: ['pizza'], emoji: '🍕' },
  { keywords: ['taco'], emoji: '🌮' },
  { keywords: ['burrito', 'wrap'], emoji: '🌯' },
  { keywords: ['sandwich', 'sub'], emoji: '🥪' },
  { keywords: ['pancake', 'pancakes', 'waffle', 'waffles'], emoji: '🥞' },
  { keywords: ['bagel'], emoji: '🥯' },
  { keywords: ['croissant', 'pastry'], emoji: '🥐' },
  { keywords: ['pretzel'], emoji: '🥨' },
  { keywords: ['cereal', 'granola', 'muesli', 'oats', 'oatmeal', 'porridge'], emoji: '🥣' },

  // Dairy
  { keywords: ['milk'], emoji: '🥛' },
  { keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan'], emoji: '🧀' },
  { keywords: ['yogurt', 'yoghurt'], emoji: '🥛' },
  { keywords: ['butter'], emoji: '🧈' },
  { keywords: ['ice cream', 'gelato', 'frozen yogurt'], emoji: '🍦' },

  // Sweets & Snacks
  { keywords: ['chocolate', 'cocoa', 'cadbury', 'dairy milk', 'snickers', 'mars', 'kit kat', 'kitkat', 'twix'], emoji: '🍫' },
  { keywords: ['candy', 'lolly', 'lollies', 'gummy', 'skittles', 'starburst'], emoji: '🍬' },
  { keywords: ['cookie', 'cookies', 'biscuit', 'biscuits', 'oreo', 'tim tam'], emoji: '🍪' },
  { keywords: ['cake', 'cupcake', 'cheesecake'], emoji: '🍰' },
  { keywords: ['pie'], emoji: '🥧' },
  { keywords: ['donut', 'doughnut'], emoji: '🍩' },
  { keywords: ['muffin'], emoji: '🧁' },
  { keywords: ['popcorn'], emoji: '🍿' },
  { keywords: ['nuts', 'almond', 'almonds', 'cashew', 'peanut', 'walnut', 'pistachio'], emoji: '🥜' },
  { keywords: ['honey'], emoji: '🍯' },

  // Drinks
  { keywords: ['coffee', 'latte', 'cappuccino', 'espresso', 'flat white'], emoji: '☕' },
  { keywords: ['tea', 'chai', 'matcha'], emoji: '🍵' },
  { keywords: ['beer', 'ale', 'lager'], emoji: '🍺' },
  { keywords: ['wine'], emoji: '🍷' },
  { keywords: ['cocktail', 'margarita', 'mojito'], emoji: '🍸' },
  { keywords: ['juice', 'smoothie'], emoji: '🧃' },
  { keywords: ['soda', 'cola', 'coke', 'pepsi', 'sprite', 'fanta', 'soft drink'], emoji: '🥤' },
  { keywords: ['water'], emoji: '💧' },
  { keywords: ['protein shake', 'protein powder', 'whey'], emoji: '🥤' },

  // Meals & Dishes
  { keywords: ['burger', 'hamburger', 'cheeseburger'], emoji: '🍔' },
  { keywords: ['curry', 'tikka', 'masala'], emoji: '🍛' },
  { keywords: ['soup', 'stew', 'chowder'], emoji: '🍲' },
  { keywords: ['sushi', 'sashimi'], emoji: '🍣' },
  { keywords: ['dumpling', 'dim sum', 'gyoza'], emoji: '🥟' },
  { keywords: ['kebab', 'skewer', 'souvlaki'], emoji: '🍢' },
  { keywords: ['fried rice', 'stir fry', 'stir-fry'], emoji: '🍳' },
  { keywords: ['nachos', 'tortilla'], emoji: '🫔' },

  // Condiments & Extras
  { keywords: ['sauce', 'ketchup', 'mayo', 'mustard', 'dressing'], emoji: '🫙' },
  { keywords: ['oil', 'olive oil'], emoji: '🫒' },
];

/**
 * Returns a representative emoji for a food item based on its name and brand.
 * Falls back to a generic food emoji if no match is found.
 */
export function getFoodEmoji(foodName: string, brandName?: string | null): string {
  const searchText = `${foodName} ${brandName ?? ''}`.toLowerCase();

  for (const { keywords, emoji } of EMOJI_MAP) {
    for (const keyword of keywords) {
      // Match whole word boundaries to avoid false positives
      // e.g. "rice" shouldn't match "price"
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (regex.test(searchText)) {
        return emoji;
      }
    }
  }

  return '🍽️'; // Default: plate with cutlery
}
