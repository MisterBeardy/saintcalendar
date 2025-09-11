#Generate a CSV file with 500 rows of dummy historical data for testing purposes.
#Each row contains a unique burger description, tap beers, can beers, a Facebook event URL, and a sticker image name.
#The data is randomly generated from predefined lists to ensure variety and realism.
import csv
import random

def generate_random_data():
    """
    Generates a single row of dummy historical data with unique values.
    """
    burger_adjectives = ["Spicy", "Savory", "Smoky", "Sweet", "Classic", "Hearty", "Zesty", "Tangy", "Bold", "Crispy", "Juicy", "Sassy", "Fiery", "Cool", "Rich", "Roasted", "Smothered", "Charred"]
    burger_nouns = ["Rancher", "Outlaw", "Gourmet", "Titan", "Maverick", "Patriot", "King", "Queen", "Warrior", "Legend", "Voyager", "Nomad", "Wrangler", "Hunter", "Trapper"]
    toppings = [
        "jalapeño poppers", "bacon", "cheddar cheese", "smoked brisket", "crispy onion straws",
        "BBQ sauce", "avocado", "sprouts", "vegan aioli", "pepper jack cheese",
        "sriracha mayo", "blue cheese crumbles", "caramelized onions", "bacon jam",
        "tzatziki sauce", "cucumber", "red onion", "feta cheese", "pineapple-glaze",
        "swiss cheese", "fried egg", "mushrooms", "chorizo", "salsa", "guacamole", "pickled red cabbage",
        "pulled pork", "provolone", "arugula", "roasted red peppers", "goat cheese", "pesto"
    ]
    buns = ["brioche bun", "pretzel bun", "sesame seed bun", "potato bun", "gluten-free bun", "ciabatta roll", "kaiser roll", "rye bun"]

    # Master lists for beers, expanded to over 50 items each
    shared_beers = [
        "Lagunitas IPA", "Sierra Nevada Pale Ale", "New Belgium Fat Tire",
        "Stone IPA", "Bell's Two Hearted Ale", "Modelo Especial", "Corona Extra",
        "Founders All Day IPA", "Heineken", "Pabst Blue Ribbon",
        "Blue Moon Belgian White", "Coors Light", "Michelob Ultra", "Miller Lite",
        "Bud Light", "Stella Artois", "Yuengling Lager", "Shiner Bock",
        "Heineken 0.0", "Lagunitas Daytime IPA", "Stone Delicious IPA",
        "Sam Adams Boston Lager", "Dogfish Head 60 Minute IPA", "New Belgium Voodoo Ranger IPA",
        "Guinness Draught", "Firestone Walker 805", "Sierra Nevada Hazy Little Thing",
        "Anchor Steam Beer", "Founders Kentucky Breakfast Stout", "Oskar Blues Dale's Pale Ale",
        "Allagash White", "Deschutes Fresh Squeezed IPA", "Troegs Perpetual IPA",
        "Goose Island IPA", "SweetWater 420 Pale Ale", "Narragansett Lager",
        "Victory Golden Monkey", "Cigar City Jai Alai IPA", "Stone Arrogant Bastard Ale",
        "Fat Tire Amber Ale", "Great Lakes Dortmunder Gold", "Left Hand Milk Stout",
        "Dogfish Head 90 Minute IPA", "Oskar Blues Old Chub", "Brooklyn Lager",
        "Bell's Oberon Ale", "Rogue Dead Guy Ale", "Ballast Point Sculpin IPA",
        "21st Amendment Brew Free! or Die IPA", "Surly Furious IPA",
        "Kona Big Wave Golden Ale"
    ]

    tap_only_beers = [
        "Pliny the Elder", "Russian River Blind Pig IPA", "Hill Farmstead Susan",
        "Tree House Julius", "The Alchemist Heady Topper", "Bell's Expedition Stout",
        "Toppling Goliath King Sue", "3 Floyds Zombie Dust", "Trillium Congress Street IPA",
        "WeldWerks Juicy Bits", "Other Half Double Dry Hopped", "Monkish Foggy Glasses",
        "Prairie Artisan Ales Bomb!", "Avery The Reverend", "Lost Abbey Devotion Ale",
        "Cantillon Gueuze", "Orval Trappist Ale", "Chimay Blue", "Rochefort 10",
        "Westvleteren 12", "Fremont Bourbon Barrel Aged Dark Star", "Founders Breakfast Stout",
        "Surly Darkness", "Dogfish Head Palo Santo Marron", "North Coast Old Rasputin",
        "Great Lakes Edmund Fitzgerald Porter", "Half Acre Daisy Cutter Pale Ale",
        "New Glarus Spotted Cow", "Perennial Artisan Ales Abraxas", "Jester King Le Petit Prince",
        "Deschutes The Abyss", "Troegs Nugget Nectar", "Alesmith Speedway Stout",
        "Modern Times Fortunate Islands", "Firestone Walker Pivo Pils", "Green Flash West Coast IPA",
        "Port Brewing Hop 15", "Pizza Port Chronic Amber Ale", "Societe The Pupil IPA",
        "Alesmith IPA", "Karl Strauss Red Trolley Ale", "Stone Ripper Pale Ale",
        "Sierra Nevada Torpedo Extra IPA", "KBS", "SweetWater IPA", "Creature Comforts Tropicalia",
        "Funky Buddha Last Snow", "Goose Island Bourbon County Brand Stout"
    ]
    
    can_only_beers = [
        "White Claw Hard Seltzer Mango", "Truly Wild Berry Seltzer", "Tecate",
        "Angry Orchard Crisp Apple", "Strongbow Original Dry Cider", "Smirnoff Ice",
        "High Noon Pineapple", "Cutwater Tequila Margarita", "Twisted Tea Original",
        "Mike's Hard Lemonade", "Nutrl Watermelon", "Simply Spiked Lemonade",
        "Hard Seltzer Variety Packs", "Henry's Hard Soda", "Spindrift Spiked",
        "Topo Chico Hard Seltzer", "Press Seltzer", "Flying Embers Hard Kombucha",
        "JuneShine Hard Kombucha", "Dogfish Head SeaQuench Ale", "Two Roads Two Juicy",
        "Jack Daniel's Lynchburg Lemonade", "Old Style", "Coors Banquet",
        "Busch Light", "Keystone Light", "Pabst Blue Ribbon Easy", "Miller High Life",
        "Natural Light", "Bud Ice", "Genesee Cream Ale", "Red Stripe Lager",
        "Narragansett Fresh Catch", "Voodoo Ranger Juice Force IPA", "Odell 90 Shilling Ale",
        "Southern Tier Pumking Imperial Ale", "Dogfish Head Punkin Ale", "Wicked Weed Pernicious IPA",
        "Duvel Belgian Golden Ale", "Delirium Tremens", "Corsendonk Dubbel",
        "Lindemans Framboise Lambic", "Chimay White", "Stella Artois Cidre",
        "Oskar Blues Mama's Little Yella Pils", "21st Amendment El Sully",
        "Ska Modus Hoperandi", "Uinta Cutthroat Pale Ale", "New Glarus Moon Man"
    ]
    
    # Combine lists with some overlap for realism
    real_tap_beers = list(set(tap_only_beers + random.sample(shared_beers, k=min(len(shared_beers), 15))))
    real_can_beers = list(set(can_only_beers + random.sample(shared_beers, k=min(len(shared_beers), 15))))
    
    sticker_types = [".png", ".jpg", ".svg"]

    # Generate a unique burger name and description
    burger_adjective = random.choice(burger_adjectives)
    burger_noun = random.choice(burger_nouns)
    num_toppings = random.randint(2, 4)
    selected_toppings = random.sample(toppings, k=num_toppings)
    bun = random.choice(buns)
    burger_name = f"The {burger_adjective} {burger_noun}"
    burger_description = f"{burger_name} - {', '.join(selected_toppings)} on a {bun}"

    # Select 1-4 random tap beers from the real list
    num_tap_beers = random.randint(1, 4)
    selected_tap_beers = random.sample(real_tap_beers, k=num_tap_beers)
    tap_beers_str = ", ".join(selected_tap_beers)

    # Select 4-6 random can beers from the real list
    num_can_beers = random.randint(4, 6)
    selected_can_beers = random.sample(real_can_beers, k=num_can_beers)
    can_beers_str = ", ".join(selected_can_beers)

    # Generate a random Facebook event URL
    facebook_event = f"https://www.google.com/search?q=https://facebook.com/events/{random.randint(1000000, 9999999)}"

    # Generate a random sticker image name
    sticker_name = f"sticker{random.randint(100, 999)}{random.choice(sticker_types)}"

    return [burger_description, tap_beers_str, can_beers_str, facebook_event, sticker_name]

# Main script to create the CSV file
def create_csv_file(num_rows=500):
    """
    Creates a CSV file with the specified number of rows of dummy data.
    """
    with open('dummy_historical_data.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, delimiter=';', quoting=csv.QUOTE_ALL)
        
        # Write the header row
        header = ["Historical Burger", "Historical Tap Beers", "Historical Can Beers", "Historical Facebook Event", "Historical Sticker"]
        writer.writerow(header)
        
        # Write the data rows
        for _ in range(num_rows):
            row = generate_random_data()
            writer.writerow(row)

    print(f"Successfully generated {num_rows} rows of data in 'dummy_historical_data.csv'")

if __name__ == "__main__":
    create_csv_file()
