import readline from 'readline';
import { promisify } from 'util';

const BASE_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  try {
    console.log('=== Sticker Search and Details Workflow Test ===\n');

    // Step 1: Prompt for search criteria
    console.log('Search options:');
    console.log('1. By saint name');
    console.log('2. By location (city/state)');
    console.log('3. By year');
    const searchTypeInput = await ask('Choose search type (1-3): ');
    const searchType = parseInt(searchTypeInput);

    let queryParams = '';
    let searchTerm = '';

    if (searchType === 1) {
      searchTerm = await ask('Enter saint name to search: ');
      if (!searchTerm.trim()) {
        console.log('No name entered. Exiting.');
        rl.close();
        return;
      }
      queryParams = `saint=${encodeURIComponent(searchTerm.trim())}`;
    } else if (searchType === 2) {
      searchTerm = await ask('Enter location (city, state) to search: ');
      if (!searchTerm.trim()) {
        console.log('No location entered. Exiting.');
        rl.close();
        return;
      }
      // For location, we might need locationId, but for simplicity, assume search by saint or year
      // Since API doesn't have direct location search, we'll use saint name for now
      console.log('Location search not directly supported, searching by saint name instead.');
      queryParams = `saint=${encodeURIComponent(searchTerm.trim())}`;
    } else if (searchType === 3) {
      searchTerm = await ask('Enter year to search: ');
      if (!searchTerm.trim()) {
        console.log('No year entered. Exiting.');
        rl.close();
        return;
      }
      const year = parseInt(searchTerm.trim());
      if (isNaN(year)) {
        console.log('Invalid year. Exiting.');
        rl.close();
        return;
      }
      queryParams = `year=${year}`;
    } else {
      console.log('Invalid choice. Exiting.');
      rl.close();
      return;
    }

    // Step 2: Search for stickers
    console.log('\nSearching for stickers...');
    const response = await fetchJson(`${BASE_URL}/api/stickers?${queryParams}&includeEvents=true`);

    if (!response.stickers || response.stickers.length === 0) {
      console.log('No stickers found matching the search criteria.');
      rl.close();
      return;
    }

    // Step 3: Display matching stickers and allow selection
    console.log('\nMatching stickers:');
    response.stickers.forEach((sticker, index) => {
      console.log(`${index + 1}. ${sticker.saint?.name || 'Unknown Saint'} - ${sticker.location?.name || 'Unknown Location'} (${sticker.year}) - Type: ${sticker.type}`);
    });

    const selectionInput = await ask('\nSelect a sticker (enter number): ');
    const selection = parseInt(selectionInput);
    if (isNaN(selection) || selection < 1 || selection > response.stickers.length) {
      console.log('Invalid selection. Exiting.');
      rl.close();
      return;
    }

    const selectedSticker = response.stickers[selection - 1];
    console.log(`\nSelected: ${selectedSticker.saint?.name || 'Unknown'} - ${selectedSticker.location?.name || 'Unknown'} (${selectedSticker.year})`);

    // Step 4: Show detailed sticker information
    console.log('\n=== STICKER DETAILS ===');
    console.log(`ID: ${selectedSticker.id}`);
    console.log(`Year: ${selectedSticker.year}`);
    console.log(`Image URL: ${selectedSticker.imageUrl}`);
    console.log(`Type: ${selectedSticker.type}`);
    console.log(`Location: ${selectedSticker.location ? `${selectedSticker.location.name} (${selectedSticker.location.city}, ${selectedSticker.location.state})` : 'None'}`);
    console.log(`Saint: ${selectedSticker.saint ? `${selectedSticker.saint.name} (${selectedSticker.saint.saintName || 'N/A'})` : 'None'}`);

    // Step 5: Show associated events if available
    if (selectedSticker.saint?.events && selectedSticker.saint.events.length > 0) {
      console.log('\nAssociated Events:');
      selectedSticker.saint.events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.beers} beers) on ${event.date} - Type: ${event.eventType}`);
      });
    } else {
      console.log('\nNo associated events found.');
    }

    // Step 6: Fetch and show milestones for the saint
    if (selectedSticker.saint?.id) {
      console.log('\nFetching milestones...');
      try {
        const milestones = await fetchJson(`${BASE_URL}/api/saints/${selectedSticker.saint.id}/milestones`);

        if (milestones && milestones.length > 0) {
          console.log('\nAssociated Milestones/Events:');
          milestones.forEach((milestone, index) => {
            console.log(`${index + 1}. ${milestone}`);
          });
        } else {
          console.log('No milestones found for this saint.');
        }
      } catch (error) {
        console.log('Error fetching milestones:', error.message);
      }
    }

    // Step 7: Show summary
    console.log('\n=== SUMMARY ===');
    console.log(`Sticker ID: ${selectedSticker.id}`);
    console.log(`Saint: ${selectedSticker.saint?.name || 'Unknown'}`);
    console.log(`Location: ${selectedSticker.location?.name || 'Unknown'}`);
    console.log(`Year: ${selectedSticker.year}`);
    console.log(`Type: ${selectedSticker.type}`);
    console.log(`Image: ${selectedSticker.imageUrl}`);
    console.log('\nWorkflow completed successfully!');

  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    rl.close();
  }
}

main();